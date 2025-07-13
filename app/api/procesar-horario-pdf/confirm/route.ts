// app/api/procesar-horario-pdf/confirm/route.ts
// Esta ruta confirma la carga de datos del horario, manejando duplicados
// y realizando todas las inserciones dentro de una transacción de base de datos.

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { NextRequest } from "next/server";

// Tipos para la solicitud y los duplicados
interface DuplicateItem {
  type: "profesor" | "materia";
  name: string;
  existingId: number;
  action: "replace" | "skip" | "keep_both";
}

const getTableNamesByPeriod = (periodId: string) => {
    switch (periodId) {
        case "1": return { materias: "materias_enero_abril", grupos: "grupos_enero_abril" };
        case "2": return { materias: "materias_mayo_agosto", grupos: "grupos_mayo_agosto" };
        case "3": return { materias: "materias_septiembre_diciembre", grupos: "grupos_septiembre_diciembre" };
        default: throw new Error("Periodo no válido");
    }
};

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const { periodoId, duplicates, processingResults } = await request.json();

    if (!periodoId || !duplicates || !processingResults) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const { materias, profesores, grupos } = processingResults;
    const tables = getTableNamesByPeriod(periodoId);

    // --- Inicio de la Transacción ---
    await connection.beginTransaction();

    // --- Procesar Profesores ---
    const profesoresMap: Record<number, number> = {}; // Mapea índice original a ID de BD
    for (let i = 0; i < profesores.length; i++) {
        const profesor = profesores[i];
        const duplicado = duplicates.find((d: DuplicateItem) => d.type === "profesor" && d.name === profesor.nombre);

        if (duplicado) {
            if (duplicado.action === "replace") {
                await connection.query("UPDATE profesores SET email = ? WHERE id = ?", [profesor.email, duplicado.existingId]);
                profesoresMap[i + 1] = duplicado.existingId;
            } else if (duplicado.action === "skip") {
                profesoresMap[i + 1] = duplicado.existingId;
            } else { // keep_both
                const [result]: [any, any] = await connection.query("INSERT INTO profesores (nombre, email) VALUES (?, ?)", [`${profesor.nombre} (Nuevo)`, profesor.email]);
                profesoresMap[i + 1] = result.insertId;
            }
        } else {
            const [result]: [any, any] = await connection.query("INSERT INTO profesores (nombre, email) VALUES (?, ?)", [profesor.nombre, profesor.email]);
            profesoresMap[i + 1] = result.insertId;
        }
    }

    // --- Procesar Materias ---
    const materiasMap: Record<number, number> = {}; // Mapea índice original a ID de BD
    for (let i = 0; i < materias.length; i++) {
        const materia = materias[i];
        const profesorId = materia.profesor_id ? profesoresMap[materia.profesor_id] : null;
        const duplicado = duplicates.find((d: DuplicateItem) => d.type === "materia" && d.name === materia.nombre);

        if (duplicado) {
            if (duplicado.action === "replace") {
                await connection.query(`UPDATE ${tables.materias} SET profesor_id = ? WHERE id = ?`, [profesorId, duplicado.existingId]);
                materiasMap[i + 1] = duplicado.existingId;
            } else if (duplicado.action === "skip") {
                materiasMap[i + 1] = duplicado.existingId;
            } else { // keep_both
                const [result]: [any, any] = await connection.query(`INSERT INTO ${tables.materias} (nombre, profesor_id) VALUES (?, ?)`, [`${materia.nombre} (Nuevo)`, profesorId]);
                materiasMap[i + 1] = result.insertId;
            }
        } else {
            const [result]: [any, any] = await connection.query(`INSERT INTO ${tables.materias} (nombre, profesor_id) VALUES (?, ?)`, [materia.nombre, profesorId]);
            materiasMap[i + 1] = result.insertId;
        }
    }

    // --- Procesar Grupos ---
    let gruposInsertadosCount = 0;
    if (grupos.length > 0) {
        const gruposValues = grupos.map((grupo: any) => {
            const materiaId = grupo.materia_id ? materiasMap[grupo.materia_id] : null;
            if (!materiaId) return null; // Si no hay ID de materia, no se puede insertar
            return [
                materiaId,
                grupo.numero,
                grupo.alumnos,
                grupo.turno,
                JSON.stringify(grupo.horarios)
            ];
        }).filter(Boolean); // Eliminar nulos

        if (gruposValues.length > 0) {
            const [result]: [any, any] = await connection.query(
                `INSERT INTO ${tables.grupos} (materia_id, numero, alumnos, turno, horarios) VALUES ?`,
                [gruposValues]
            );
            gruposInsertadosCount = result.affectedRows;
        }
    }

    // --- Fin de la Transacción ---
    await connection.commit();

    return NextResponse.json({
      success: true,
      stats: {
        profesores: Object.keys(profesoresMap).length,
        materias: Object.keys(materiasMap).length,
        grupos: gruposInsertadosCount,
      },
      periodoId,
    });

  } catch (error: any) {
    // Si algo falla, deshacer todos los cambios.
    await connection.rollback();
    console.error("Error al confirmar la carga del horario:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  } finally {
    // Liberar la conexión para devolverla al pool.
    connection.release();
  }
}