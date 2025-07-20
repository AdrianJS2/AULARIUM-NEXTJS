// RUTA: app/api/horarios/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

const getTableNames = (periodoId: string) => {
    switch (periodoId) {
        case "1": return { materias: "materias_enero_abril", grupos: "grupos_enero_abril", asignaciones: "asignaciones_enero_abril" };
        case "2": return { materias: "materias_mayo_agosto", grupos: "grupos_mayo_agosto", asignaciones: "asignaciones_mayo_agosto" };
        case "3": return { materias: "materias_septiembre_diciembre", grupos: "grupos_septiembre_diciembre", asignaciones: "asignaciones_septiembre_diciembre" };
        default: return null; // Devuelve null si el ID no es válido
    }
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const periodoId = searchParams.get('periodoId');
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    const carreraId = searchParams.get('carreraId');

    // ✅ CORRECCIÓN: Verificación robusta al inicio de la función.
    if (!periodoId || !userId || !userRole) {
        return NextResponse.json({ error: "Faltan parámetros requeridos (periodoId, userId, userRole)." }, { status: 400 });
    }

    const tables = getTableNames(periodoId);
    if (!tables) {
        return NextResponse.json({ error: "El 'periodoId' proporcionado no es válido." }, { status: 400 });
    }

    try {
        const [aulas] = await pool.query("SELECT id, nombre FROM aulas");
        const [profesores] = await pool.query("SELECT id, nombre FROM profesores");
        
        let materiasQuery = `SELECT * FROM ${tables.materias}`;
        const params: (string | number)[] = [];
        
        // La lógica de filtrado por rol se mantiene
        if (userRole.toLowerCase() !== 'admin') {
            if (userRole.toLowerCase() === 'coordinador' && carreraId) {
                materiasQuery += " WHERE carrera_id = ?";
                params.push(Number(carreraId));
            } else {
                materiasQuery += " WHERE usuario_id = ?";
                params.push(userId);
            }
        }
        
        const [materias] = await pool.query(materiasQuery, params);

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

        return NextResponse.json({ aulas, profesores, materias, grupos, asignaciones });

    } catch (error: any) {
        console.error("API GET /api/horarios Error:", error);
        return NextResponse.json({ error: "Error de base de datos al obtener los datos para los horarios.", details: error.message }, { status: 500 });
    }
}