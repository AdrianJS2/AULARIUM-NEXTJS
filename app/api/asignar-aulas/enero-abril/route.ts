// RUTA: app/api/asignar-aulas/enero-abril/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { isAdmin, getUserRole } from "@/lib/auth-server"; // Usando el helper del servidor
import type { NextRequest } from "next/server";


// Lógica de asignación (abstraída para reutilización)
async function performAssignment(connection: any, aulas: any[], grupos: any[], materias: any[], tables: { asignaciones: string }) {
    const gruposConHorarios = grupos.map((grupo: any) => ({
        ...grupo,
        horarios: Array.isArray(grupo.horarios) ? grupo.horarios : JSON.parse(grupo.horarios || "[]"),
    }));
    
    gruposConHorarios.sort((a: any, b: any) => b.alumnos - a.alumnos);

    const asignaciones: (string | number | null)[][] = [];
    for (const grupo of gruposConHorarios) {
        for (const horario of grupo.horarios) {
            const materia = materias.find((m: any) => m.id === grupo.materia_id);
            if (!materia) continue;

            const aulasDisponiblesParaHorario = aulas.filter((aula: any) => {
                const aulaOcupada = asignaciones.some(
                    (a: any) =>
                        a[1] === aula.id && // El índice 1 será aula_id en el array de inserción
                        a[3] === horario.dia && // Índice 3 es dia
                        ((a[4] <= horario.hora_inicio && a[5] > horario.hora_inicio) ||
                         (a[4] < horario.hora_fin && a[5] >= horario.hora_fin))
                );
                return !aulaOcupada && aula.capacidad >= grupo.alumnos;
            });
            
            aulasDisponiblesParaHorario.sort((a: any, b: any) => a.capacidad - b.capacidad);
            const aulaAsignada = aulasDisponiblesParaHorario[0]; // El aula más pequeña que cumple

            asignaciones.push([
                grupo.id,
                aulaAsignada?.id || null,
                grupo.materia_id,
                horario.dia,
                horario.hora_inicio,
                horario.hora_fin,
                grupo.turno,
                materia.carrera_id || null,
            ]);
        }
    }

    if (asignaciones.length > 0) {
        await connection.query(
            `INSERT INTO ${tables.asignaciones} (grupo_id, aula_id, materia_id, dia, hora_inicio, hora_fin, turno, carrera_id) VALUES ?`,
            [asignaciones]
        );
    }
}


export async function POST(request: NextRequest) {
    const connection = await pool.getConnection();
    try {
        const { aulas, carreraId, userId } = await request.json(); // Recibimos el userId desde el frontend

        if (!userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        
        const { rol, carrera_id } = await getUserRole(userId);
        const admin = await isAdmin(userId);
        
        const tables = { materias: "materias_enero_abril", grupos: "grupos_enero_abril", asignaciones: "asignaciones_enero_abril" };

        await connection.beginTransaction();

        let materiasQuery = `SELECT * FROM ${tables.materias}`;
        const params: (string | number)[] = [];
        
        if (!admin) {
            if (rol === 'coordinador' && carrera_id) {
                materiasQuery += " WHERE carrera_id = ?";
                params.push(carrera_id);
            } else {
                materiasQuery += " WHERE usuario_id = ?";
                params.push(userId);
            }
        } else if (carreraId) {
            materiasQuery += " WHERE carrera_id = ?";
            params.push(carreraId);
        }
        
        const [materias]: [any[], any] = await connection.query(materiasQuery, params);
        if (materias.length === 0) {
            await connection.rollback();
            return NextResponse.json({ error: "No hay materias para asignar" }, { status: 404 });
        }

        const materiaIds = materias.map((m: any) => m.id);
        const [grupos]: [any[], any] = await connection.query(`SELECT * FROM ${tables.grupos} WHERE materia_id IN (?)`, [materiaIds]);
        if (grupos.length === 0) {
            await connection.rollback();
            return NextResponse.json({ error: "No hay grupos para asignar" }, { status: 404 });
        }

        const grupoIds = grupos.map((g: any) => g.id);
        await connection.query(`DELETE FROM ${tables.asignaciones} WHERE grupo_id IN (?)`, [grupoIds]);

        await performAssignment(connection, aulas, grupos, materias, tables);
        
        await connection.commit();

        const [insertedData] = await pool.query(`SELECT * FROM ${tables.asignaciones} WHERE grupo_id IN (?)`, [grupoIds]);
        return NextResponse.json(insertedData);

    } catch (error: any) {
        await connection.rollback();
        console.error("Error en asignación de aulas (Enero-Abril):", error);
        return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}