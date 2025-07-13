// app/api/materias/route.ts
import { NextResponse, type NextRequest } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Función para obtener los nombres de las tablas
const getTableNames = (periodId: string) => {
    switch (periodId) {
        case "1": return { materias: "materias_enero_abril", grupos: "grupos_enero_abril", asignaciones: "asignaciones_enero_abril" };
        case "2": return { materias: "materias_mayo_agosto", grupos: "grupos_mayo_agosto", asignaciones: "asignaciones_mayo_agosto" };
        case "3": return { materias: "materias_septiembre_diciembre", grupos: "grupos_septiembre_diciembre", asignaciones: "asignaciones_septiembre_diciembre" };
        default: throw new Error("Periodo no válido");
    }
};

// POST: Crear una nueva materia
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    
    const { nombre, profesor_id, periodo_id, carrera_id } = await request.json();
    // @ts-ignore
    const usuario_id = session.user.id;

    if (!nombre || !periodo_id) {
        return NextResponse.json({ error: "Nombre y periodo son requeridos" }, { status: 400 });
    }
    
    const connection = await pool.getConnection();
    try {
        const tables = getTableNames(periodo_id);
        const [result]: [any, any] = await connection.query(
            `INSERT INTO ${tables.materias} (nombre, profesor_id, carrera_id, usuario_id) VALUES (?, ?, ?, ?)`,
            [nombre, profesor_id, carrera_id, usuario_id]
        );
        return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
    } catch (error) {
        console.error("Error al agregar materia:", error);
        return NextResponse.json({ error: "Error al agregar la materia" }, { status: 500 });
    } finally {
        connection.release();
    }
}

// DELETE: Eliminar una materia y sus dependencias
export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id, periodo_id } = await request.json();
    if (!id || !periodo_id) {
        return NextResponse.json({ error: "ID de materia y periodo son requeridos" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const tables = getTableNames(periodo_id);

        const [grupos]: [any[], any] = await connection.query(`SELECT id FROM ${tables.grupos} WHERE materia_id = ?`, [id]);
        if (grupos.length > 0) {
            const grupoIds = grupos.map(g => g.id);
            await connection.query(`DELETE FROM ${tables.asignaciones} WHERE grupo_id IN (?)`, [grupoIds]);
            await connection.query(`DELETE FROM ${tables.grupos} WHERE materia_id = ?`, [id]);
        }
        await connection.query(`DELETE FROM ${tables.materias} WHERE id = ?`, [id]);
        
        await connection.commit();
        return NextResponse.json({ success: true, message: "Materia eliminada correctamente." });

    } catch (error) {
        await connection.rollback();
        console.error("Error al eliminar materia:", error);
        return NextResponse.json({ error: "Error al eliminar la materia." }, { status: 500 });
    } finally {
        connection.release();
    }
}