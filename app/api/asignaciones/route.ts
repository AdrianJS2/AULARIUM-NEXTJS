// RUTA: app/api/asignaciones/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { NextRequest } from "next/server";
import { isAdmin, getUserRole } from "@/lib/auth-server";

const getTableNames = (periodoId: string) => {
    switch (periodoId) {
        case "1": return { materias: "materias_enero_abril", grupos: "grupos_enero_abril", asignaciones: "asignaciones_enero_abril" };
        case "2": return { materias: "materias_mayo_agosto", grupos: "grupos_mayo_agosto", asignaciones: "asignaciones_mayo_agosto" };
        case "3": return { materias: "materias_septiembre_diciembre", grupos: "grupos_septiembre_diciembre", asignaciones: "asignaciones_septiembre_diciembre" };
        default: throw new Error("Periodo no válido");
    }
};

// GET: Obtener todos los datos necesarios para la vista de Asignación
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const periodoId = searchParams.get('periodoId');
    const userId = searchParams.get('userId');

    if (!periodoId || !userId) {
        return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    try {
        const { rol, carrera_id } = await getUserRole(userId);
        const admin = await isAdmin(userId);
        const tables = getTableNames(periodoId);

        // 1. Obtener Aulas (siempre son todas)
        const [aulas] = await pool.query("SELECT * FROM aulas");

        // 2. Obtener Materias (filtradas por rol)
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
        }
        const [materias] = await pool.query(materiasQuery, params);

        // 3. Obtener Grupos y Asignaciones (basados en las materias obtenidas)
        let grupos: any[] = [];
        let asignaciones: any[] = [];
        if (Array.isArray(materias) && materias.length > 0) {
            const materiaIds = materias.map((m: any) => m.id);
            const [gruposResult] = await pool.query(`SELECT * FROM ${tables.grupos} WHERE materia_id IN (?)`, [materiaIds]);
            grupos = Array.isArray(gruposResult) ? gruposResult : [];

            if (grupos.length > 0) {
                const grupoIds = grupos.map((g: any) => g.id);
                const [asignacionesResult] = await pool.query(`SELECT * FROM ${tables.asignaciones} WHERE grupo_id IN (?)`, [grupoIds]);
                asignaciones = Array.isArray(asignacionesResult) ? asignacionesResult : [];
            }
        }

        return NextResponse.json({ aulas, materias, grupos, asignaciones });

    } catch (error: any) {
        console.error("API GET /api/asignaciones Error:", error);
        return NextResponse.json({ error: "Error al obtener los datos de asignación.", details: error.message }, { status: 500 });
    }
}

// PUT: Actualizar una asignación individual (para drag-and-drop)
export async function PUT(request: NextRequest) {
    const { asignacionId, newAulaId, periodoId } = await request.json();

    if (!asignacionId || newAulaId === undefined || !periodoId) {
        return NextResponse.json({ error: "Datos incompletos para la actualización" }, { status: 400 });
    }

    try {
        const tables = getTableNames(periodoId);
        await pool.query(
            `UPDATE ${tables.asignaciones} SET aula_id = ? WHERE id = ?`,
            [newAulaId, asignacionId]
        );
        return NextResponse.json({ success: true, message: "Asignación actualizada." });
    } catch (error: any) {
        console.error("API PUT /api/asignaciones Error:", error);
        return NextResponse.json({ error: "Error al actualizar la asignación.", details: error.message }, { status: 500 });
    }
}

// POST: Para acciones masivas como "asignar" o "deshacer"
export async function POST(request: NextRequest) {
    const { action, periodoId, userId, carreraId } = await request.json();

    if (!action || !periodoId || !userId) {
        return NextResponse.json({ error: "Faltan parámetros para la acción" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const tables = getTableNames(periodoId);

        if (action === 'deshacer') {
            // Lógica para deshacer asignaciones (basada en tu API original)
            const { rol, carrera_id } = await getUserRole(userId);
            const admin = await isAdmin(userId);

            let deleteQuery = `DELETE a FROM ${tables.asignaciones} a JOIN ${tables.materias} m ON a.materia_id = m.id`;
            const params: (string | number)[] = [];

            if (!admin) {
                if (rol === 'coordinador' && carrera_id) {
                    deleteQuery += " WHERE m.carrera_id = ?";
                    params.push(carrera_id);
                } else {
                    deleteQuery += " WHERE m.usuario_id = ?";
                    params.push(userId);
                }
            }
            // Si es admin, no hay WHERE, borra todas las asignaciones del período.
            await connection.query(deleteQuery, params);
            await connection.commit();
            return NextResponse.json({ success: true, message: "Asignaciones deshechas." });
        }
        
        // Si la acción no es reconocida
        await connection.rollback();
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });

    } catch (error: any) {
        await connection.rollback();
        console.error(`API POST /api/asignaciones (action: ${action}) Error:`, error);
        return NextResponse.json({ error: "Error al procesar la solicitud.", details: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}