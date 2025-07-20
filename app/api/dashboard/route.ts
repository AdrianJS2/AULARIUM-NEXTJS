// RUTA: app/api/dashboard/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { NextRequest } from "next/server";
import { isAdmin as isAdminServer, getUserRole } from "@/lib/auth-server";

const getTableNames = (periodoId: string) => {
    switch (periodoId) {
        case "1": return { materias: "materias_enero_abril", grupos: "grupos_enero_abril", asignaciones: "asignaciones_enero_abril" };
        case "2": return { materias: "materias_mayo_agosto", grupos: "grupos_mayo_agosto", asignaciones: "asignaciones_mayo_agosto" };
        case "3": return { materias: "materias_septiembre_diciembre", grupos: "grupos_septiembre_diciembre", asignaciones: "asignaciones_septiembre_diciembre" };
        default: throw new Error("Periodo no válido");
    }
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const periodoId = searchParams.get('periodoId');
    const userId = searchParams.get('userId');

    if (!periodoId || !userId) {
        return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    try {
        const admin = await isAdminServer(userId);
        const { rol, carrera_id } = await getUserRole(userId);
        const tables = getTableNames(periodoId);
        
        // --- CÁLCULOS GENERALES ---
        const [[profesoresCountResult]] = await pool.query("SELECT COUNT(*) as count FROM profesores");
        const [[aulasCountResult]] = await pool.query("SELECT COUNT(*) as count FROM aulas");
        const [[periodoResult]]: [any[], any] = await pool.query("SELECT nombre FROM periodos WHERE id = ?", [periodoId]);
        const [[userResult]]: [any[], any] = await pool.query("SELECT nombre FROM usuarios WHERE id = ?", [userId]);

        let stats: any = {
            profesores: profesoresCountResult.count,
            aulas: aulasCountResult.count,
        };

        let materiaIds: number[] = [];

        // --- CÁLCULOS ESPECIALIZADOS POR ROL ---
        if (admin) {
            const [[materiasCount]] = await pool.query(`SELECT COUNT(*) as count FROM ${tables.materias}`);
            const [[gruposCount]] = await pool.query(`SELECT COUNT(*) as count FROM ${tables.grupos}`);
            stats.materias = materiasCount.count;
            stats.grupos = gruposCount.count;
            const [allMaterias]: [any[], any] = await pool.query(`SELECT id FROM ${tables.materias}`);
            materiaIds = allMaterias.map(m => m.id);
        } else {
            let materiasQuery = `SELECT id FROM ${tables.materias} WHERE usuario_id = ?`;
            if (rol === 'coordinador' && carrera_id) {
                materiasQuery = `SELECT id FROM ${tables.materias} WHERE carrera_id = ?`;
            }
            const [materiasRows]: [any[], any] = await pool.query(materiasQuery, [rol === 'coordinador' ? carrera_id : userId]);
            materiaIds = materiasRows.map((m: any) => m.id);
            stats.materias = materiaIds.length;

            if (materiaIds.length > 0) {
                const [[gruposCount]] = await pool.query(`SELECT COUNT(*) as count FROM ${tables.grupos} WHERE materia_id IN (?)`, [materiaIds]);
                stats.grupos = gruposCount.count;
            } else {
                stats.grupos = 0;
            }
        }
        
        // Con los materiaIds, obtenemos el resto de los conteos
        if (materiaIds.length > 0) {
            const [[asignacionesCount]] = await pool.query(`SELECT COUNT(*) as count FROM ${tables.asignaciones} WHERE materia_id IN (?)`, [materiaIds]);
            stats.asignaciones = asignacionesCount.count;
        } else {
            stats.asignaciones = 0;
        }

        stats.porcentajeAsignado = stats.grupos > 0 ? Math.min(100, Math.round((stats.asignaciones / stats.grupos) * 100)) : 0;
        
        // --- DATOS PARA GRÁFICOS ---
        const [turnosResult]: [any[], any] = await pool.query(`SELECT turno, COUNT(*) as count FROM ${tables.grupos} GROUP BY turno`);
        const distribucionTurnos = {
            mañana: turnosResult.find(t => t.turno === 'MAÑANA')?.count || 0,
            tarde: turnosResult.find(t => t.turno === 'TARDE')?.count || 0
        };

        const [diasResult]: [any[], any] = await pool.query(`SELECT dia, COUNT(*) as count FROM ${tables.asignaciones} GROUP BY dia`);
        const distribucionDias = {
            Lunes: diasResult.find(d => d.dia === 'Lunes')?.count || 0,
            Martes: diasResult.find(d => d.dia === 'Martes')?.count || 0,
            Miércoles: diasResult.find(d => d.dia === 'Miércoles')?.count || 0,
            Jueves: diasResult.find(d => d.dia === 'Jueves')?.count || 0,
            Viernes: diasResult.find(d => d.dia === 'Viernes')?.count || 0
        };

        // --- ACTIVIDAD RECIENTE (para no-admins) ---
        let recentActivity: any[] = [];
        if(!admin) {
            const [activityRows]: [any[], any] = await pool.query(`SELECT nombre, created_at FROM ${tables.materias} WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 5`, [userId]);
            recentActivity = activityRows.map((m: any) => ({
                type: "materia",
                name: m.nombre,
                date: new Date(m.created_at).toLocaleDateString(),
                action: "creada",
            }));
        }

        return NextResponse.json({ 
            stats, 
            periodoNombre: periodoResult?.nombre || '',
            userName: userResult?.nombre || '',
            distribucionTurnos,
            distribucionDias,
            recentActivity
        });

    } catch (error: any) {
        console.error("API GET /api/dashboard Error:", error);
        return NextResponse.json({ error: "Error al obtener las estadísticas.", details: error.message }, { status: 500 });
    }
}