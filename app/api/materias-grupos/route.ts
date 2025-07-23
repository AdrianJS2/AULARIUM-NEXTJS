// app/api/materias-grupos/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { NextRequest } from "next/server";
export const dynamic = 'force-dynamic';

// Función auxiliar para obtener los nombres de las tablas según el período
const getTableNames = (periodoId: string) => {
    switch (periodoId) {
      case "1": 
        return { 
          materias: "materias_enero_abril", 
          grupos: "grupos_enero_abril", 
          asignaciones: "asignaciones_enero_abril" // <-- Se añade esta línea
        };
      case "2": 
        return { 
          materias: "materias_mayo_agosto", 
          grupos: "grupos_mayo_agosto", 
          asignaciones: "asignaciones_mayo_agosto" // <-- Se añade esta línea
        };
      case "3": 
        return { 
          materias: "materias_septiembre_diciembre", 
          grupos: "grupos_septiembre_diciembre", 
          asignaciones: "asignaciones_septiembre_diciembre" // <-- Se añade esta línea
        };
      default: 
        throw new Error("Periodo no válido");
    }
  };
// GET: Obtener materias y grupos para un período específico
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const periodoId = searchParams.get('periodoId');
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    const carreraId = searchParams.get('carreraId');
  
    if (!periodoId) {
      return NextResponse.json({ error: "El ID del período es requerido" }, { status: 400 });
    }
  
    try {
      const tables = getTableNames(periodoId);
      
      let materiasQuery = `SELECT * FROM ${tables.materias}`;
      const params: (string | number | null)[] = [];
  
      // HE AQUÍ LA CORRECCIÓN: Usamos toLowerCase() para una comparación segura.
      if (userRole?.toLowerCase() !== 'admin') {
        if (userRole?.toLowerCase() === 'coordinador' && carreraId) {
          materiasQuery += " WHERE carrera_id = ?";
          params.push(Number(carreraId));
        } else if (userId) {
          // Este filtro se aplicaba incorrectamente a tu usuario admin.
          materiasQuery += " WHERE usuario_id = ?";
          params.push(userId);
        }
      }
      
      const [materias] = await pool.query(materiasQuery, params);
  
      let grupos: any[] = [];
      if (Array.isArray(materias) && materias.length > 0) {
        const materiaIds = materias.map((m: any) => m.id);
        const [gruposResult] = await pool.query(`SELECT * FROM ${tables.grupos} WHERE materia_id IN (?)`, [materiaIds]);
        grupos = Array.isArray(gruposResult) ? gruposResult : [];
      }
  
      return NextResponse.json({ materias, grupos });
  
    } catch (error: any) {
      console.error("API GET /api/materias-grupos Error:", error);
      return NextResponse.json({ error: "Error al obtener datos.", details: error.message }, { status: 500 });
    }
  }

// POST: Crear una nueva materia o grupo

export async function POST(request: NextRequest) {
    const { type, payload, periodoId } = await request.json();
    if (!type || !payload || !periodoId) {
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const tables = getTableNames(periodoId);
        let insertId: number | null = null; // Usaremos una variable dedicada para el ID.

        if (type === 'materia') {
            const { nombre, profesor_id, carrera_id, usuario_id } = payload;
            const [result]: [any, any] = await connection.query(
                `INSERT INTO ${tables.materias} (nombre, profesor_id, carrera_id, usuario_id) VALUES (?, ?, ?, ?)`,
                [nombre, profesor_id, carrera_id, usuario_id]
            );
            insertId = result.insertId;

        } else if (type === 'grupo') {
            const { materia_id, numero, alumnos, turno, horarios } = payload;
            const [grupoResult]: [any, any] = await connection.query(
                `INSERT INTO ${tables.grupos} (materia_id, numero, alumnos, turno, horarios) VALUES (?, ?, ?, ?, ?)`,
                [materia_id, numero, alumnos, turno, JSON.stringify(horarios)]
            );
            
            // Asignamos el ID del grupo recién creado.
            insertId = grupoResult.insertId; 

            if (horarios && horarios.length > 0) {
                const asignacionesParaInsertar = horarios.map((horario: any) => [
                    insertId, // Usamos el ID que acabamos de obtener.
                    null,
                    materia_id,
                    horario.dia,
                    horario.hora_inicio,
                    horario.hora_fin,
                    turno
                ]);
                if (asignacionesParaInsertar.length > 0) {
                    await connection.query(
                        `INSERT INTO ${tables.asignaciones} (grupo_id, aula_id, materia_id, dia, hora_inicio, hora_fin, turno) VALUES ?`,
                        [asignacionesParaInsertar]
                    );
                }
            }
        } else {
            return NextResponse.json({ error: "Tipo de operación no válido" }, { status: 400 });
        }

        await connection.commit();
        // Devolvemos la variable `insertId` que siempre tendrá un valor.
        return NextResponse.json({ success: true, insertId: insertId }, { status: 201 });

    } catch (error: any) {
        await connection.rollback();
        console.error(`API POST /api/materias-grupos (${type}) Error:`, error);
        return NextResponse.json({ error: `Error al crear ${type}.`, details: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}

// PUT: Actualizar una materia o grupo
export async function PUT(request: NextRequest) {
    const { type, payload, periodoId } = await request.json();

    if (!type || !payload || !payload.id || !periodoId) {
        return NextResponse.json({ error: "Datos incompletos para la actualización" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
        // Inicia la transacción para garantizar que todas las operaciones se completen o ninguna lo haga.
        await connection.beginTransaction(); 

        const tables = getTableNames(periodoId);
        let result;

        if (type === 'materia') {
            const { id, nombre, profesor_id } = payload;
            [result] = await connection.query(
                `UPDATE ${tables.materias} SET nombre = ?, profesor_id = ? WHERE id = ?`,
                [nombre, profesor_id, id]
            );
        } else if (type === 'grupo') {
            const { id, numero, alumnos, turno, horarios, materia_id } = payload;
            
            // 1. Actualiza la información principal del grupo.
            [result] = await connection.query(
                `UPDATE ${tables.grupos} SET numero = ?, alumnos = ?, turno = ?, horarios = ? WHERE id = ?`,
                [numero, alumnos, turno, JSON.stringify(horarios), id]
            );
            
            // 2. Elimina TODAS las asignaciones anteriores para este grupo para evitar duplicados o inconsistencias.
            await connection.query(`DELETE FROM ${tables.asignaciones} WHERE grupo_id = ?`, [id]);

            // 3. Vuelve a crear las asignaciones con los horarios actualizados.
            if (horarios && horarios.length > 0) {
                const asignacionesParaInsertar = horarios.map((horario: any) => [
                    id, // El ID del grupo que estamos actualizando
                    null, // El aula_id se asignará después en el módulo de Asignación.
                    materia_id,
                    horario.dia,
                    horario.hora_inicio,
                    horario.hora_fin,
                    turno
                ]);

                if(asignacionesParaInsertar.length > 0){
                    await connection.query(
                        `INSERT INTO ${tables.asignaciones} (grupo_id, aula_id, materia_id, dia, hora_inicio, hora_fin, turno) VALUES ?`,
                        [asignacionesParaInsertar]
                    );
                }
            }
        } else {
            await connection.rollback(); // Si el tipo no es válido, deshacemos la transacción.
            return NextResponse.json({ error: "Tipo de operación no válido" }, { status: 400 });
        }
        
        // Si todo salió bien, confirma todos los cambios en la base de datos.
        await connection.commit();
        return NextResponse.json({ success: true, affectedRows: (result as any).affectedRows });

    } catch (error: any) {
        // Si cualquier paso falla, deshace todos los cambios anteriores.
        await connection.rollback();
        console.error(`API PUT /api/materias-grupos (${type}) Error:`, error);
        return NextResponse.json({ error: `Error al actualizar ${type}.`, details: error.message }, { status: 500 });
    } finally {
        // Siempre libera la conexión para que otros puedan usarla.
        connection.release();
    }
}

// DELETE: Eliminar una materia o grupo
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const periodoId = searchParams.get('periodoId');

    if (!id || !type || !periodoId) {
        return NextResponse.json({ error: "Faltan parámetros para la eliminación" }, { status: 400 });
    }
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const tables = getTableNames(periodoId);

        if (type === 'materia') {
            // Eliminar asignaciones y grupos asociados antes de eliminar la materia
            const [grupos]: [any[], any] = await connection.query(`SELECT id FROM ${tables.grupos} WHERE materia_id = ?`, [id]);
            if (grupos.length > 0) {
                const grupoIds = grupos.map((g: any) => g.id);
                await connection.query(`DELETE FROM ${tables.asignaciones} WHERE grupo_id IN (?)`, [grupoIds]);
                await connection.query(`DELETE FROM ${tables.grupos} WHERE materia_id = ?`, [id]);
            }
            await connection.query(`DELETE FROM ${tables.materias} WHERE id = ?`, [id]);
        } else if (type === 'grupo') {
            // Eliminar asignaciones asociadas antes de eliminar el grupo
            await connection.query(`DELETE FROM ${tables.asignaciones} WHERE grupo_id = ?`, [id]);
            await connection.query(`DELETE FROM ${tables.grupos} WHERE id = ?`, [id]);
        } else {
            return NextResponse.json({ error: "Tipo de operación no válido" }, { status: 400 });
        }
        
        await connection.commit();
        return NextResponse.json({ success: true, message: `${type === 'materia' ? 'Materia' : 'Grupo'} y sus datos asociados eliminados correctamente.` });

    } catch (error: any) {
        await connection.rollback();
        console.error(`API DELETE /api/materias-grupos (${type}) Error:`, error);
        return NextResponse.json({ error: `Error al eliminar ${type}.`, details: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}