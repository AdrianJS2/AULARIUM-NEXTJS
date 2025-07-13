// app/api/dashboard-stats/[periodo]/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ADMIN_ROLES = ["admin", "administrador"];

const getTableNames = (periodoId: string) => {
    switch (periodoId) {
        case "1": return { materias: "materias_enero_abril", grupos: "grupos_enero_abril", asignaciones: "asignaciones_enero_abril" };
        case "2": return { materias: "materias_mayo_agosto", grupos: "grupos_mayo_agosto", asignaciones: "asignaciones_mayo_agosto" };
        case "3": return { materias: "materias_septiembre_diciembre", grupos: "grupos_septiembre_diciembre", asignaciones: "asignaciones_septiembre_diciembre" };
        default: throw new Error("Periodo no válido");
    }
};

export async function GET(request: Request, { params }: { params: { periodo: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const periodoId = params.periodo;
    if (!["1", "2", "3"].includes(periodoId)) {
        return NextResponse.json({ error: "ID de periodo no válido" }, { status: 400 });
    }

    // @ts-ignore
    const userId = session.user.id;
    // @ts-ignore
    const userRole = session.user.role;
    const isAdmin = ADMIN_ROLES.includes(userRole);

    const connection = await pool.getConnection();
    try {
        const tables = getTableNames(periodoId);
        
        // Consultas generales que todos necesitan
        const [[{ count: profesores }]] = await connection.query("SELECT COUNT(*) as count FROM profesores");
        const [[{ count: aulas }]] = await connection.query("SELECT COUNT(*) as count FROM aulas");
        const [[{ nombre: periodoNombre }]] = await connection.query("SELECT nombre FROM periodos WHERE id = ?", [periodoId]);

        let responsePayload: any = {
            profesores,
            aulas,
            periodoNombre,
            isAdmin
        };

        if (isAdmin) {
            // Lógica para Administradores (estadísticas globales)
            const [[{ count: materias }]] = await connection.query(`SELECT COUNT(*) as count FROM ${tables.materias}`);
            const [grupos]: [any[], any] = await connection.query(`SELECT turno FROM ${tables.grupos}`);
            const [asignaciones]: [any[], any] = await connection.query(`SELECT dia FROM ${tables.asignaciones}`);

            responsePayload.materias = materias;
            responsePayload.grupos = grupos.length;
            responsePayload.asignaciones = asignaciones.length;
            responsePayload.porcentajeAsignado = grupos.length > 0 ? Math.min(100, Math.round((asignaciones.length / grupos.length) * 100)) : 0;
            responsePayload.distribucionTurnos = {
                mañana: grupos.filter(g => g.turno === 'MAÑANA').length,
                tarde: grupos.filter(g => g.turno === 'TARDE').length,
            };
            responsePayload.distribucionDias = { Lunes: 0, Martes: 0, Miércoles: 0, Jueves: 0, Viernes: 0 };
            asignaciones.forEach(a => { if (responsePayload.distribucionDias[a.dia] !== undefined) responsePayload.distribucionDias[a.dia]++; });

        } else {
            // Lógica para Directores/Usuarios (estadísticas personalizadas)
            const [materiasUsuario]: [any[], any] = await connection.query(`SELECT id, nombre, created_at FROM ${tables.materias} WHERE usuario_id = ?`, [userId]);
            const materiaIds = materiasUsuario.length > 0 ? materiasUsuario.map(m => m.id) : [0];

            const [gruposUsuario]: [any[], any] = await connection.query(`SELECT id, turno FROM ${tables.grupos} WHERE materia_id IN (?)`, [materiaIds]);
            const [asignacionesUsuario]: [any[], any] = await connection.query(`SELECT dia FROM ${tables.asignaciones} WHERE materia_id IN (?)`, [materiaIds]);

            const recentActivity = materiasUsuario
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map(m => ({
                    type: "materia",
                    name: m.nombre,
                    date: new Date(m.created_at).toLocaleDateString(),
                    action: "creada",
                }));

            responsePayload.materias = materiasUsuario.length;
            responsePayload.grupos = gruposUsuario.length;
            responsePayload.asignaciones = asignacionesUsuario.length;
            responsePayload.porcentajeAsignado = gruposUsuario.length > 0 ? Math.min(100, Math.round((asignacionesUsuario.length / gruposUsuario.length) * 100)) : 0;
            responsePayload.distribucionTurnos = {
                mañana: gruposUsuario.filter(g => g.turno === 'MAÑANA').length,
                tarde: gruposUsuario.filter(g => g.turno === 'TARDE').length,
            };
            responsePayload.distribucionDias = { Lunes: 0, Martes: 0, Miércoles: 0, Jueves: 0, Viernes: 0 };
            asignacionesUsuario.forEach(a => { if (responsePayload.distribucionDias[a.dia] !== undefined) responsePayload.distribucionDias[a.dia]++; });
            responsePayload.recentActivity = recentActivity;
        }
        
        return NextResponse.json(responsePayload);

    } catch (error: any) {
        return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}