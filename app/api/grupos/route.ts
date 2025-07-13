// app/api/grupos/route.ts
import { NextResponse, type NextRequest } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Función para obtener los nombres de las tablas según el periodo
const getTableNames = (periodoId: string) => {
    switch (periodoId) {
        case "1": return { materias: "materias_enero_abril", grupos: "grupos_enero_abril", asignaciones: "asignaciones_enero_abril" };
        case "2": return { materias: "materias_mayo_agosto", grupos: "grupos_mayo_agosto", asignaciones: "asignaciones_mayo_agosto" };
        case "3": return { materias: "materias_septiembre_diciembre", grupos: "grupos_septiembre_diciembre", asignaciones: "asignaciones_septiembre_diciembre" };
        default: throw new Error("Periodo no válido");
    }
};

// POST: Crear un nuevo grupo
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { materia_id, numero, alumnos, turno, horarios, periodo_id } = await request.json();

    if (!materia_id || !numero || !alumnos || !turno || !horarios || !periodo_id) {
        return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
        const tables = getTableNames(periodo_id);
        
        // Aquí iría la lógica de verificación de conflictos (la implementaremos después)

        await connection.beginTransaction();

        // Insertar el grupo
        const [result]: [any, any] = await connection.query(
            `INSERT INTO ${tables.grupos} (materia_id, numero, alumnos, turno, horarios) VALUES (?, ?, ?, ?, ?)`,
            [materia_id, numero, alumnos, turno, JSON.stringify(horarios)]
        );
        const grupoId = result.insertId;

        // Crear asignaciones vacías para el nuevo grupo
        const asignacionesValues = horarios.map((h: any) => [
            grupoId, null, materia_id, h.dia, h.hora_inicio, h.hora_fin, turno
        ]);
        
        if (asignacionesValues.length > 0) {
            await connection.query(
                `INSERT INTO ${tables.asignaciones} (grupo_id, aula_id, materia_id, dia, hora_inicio, hora_fin, turno) VALUES ?`,
                [asignacionesValues]
            );
        }

        await connection.commit();
        return NextResponse.json({ success: true, id: grupoId }, { status: 201 });

    } catch (error: any) {
        await connection.rollback();
        return NextResponse.json({ error: "Error al agregar el grupo: " + error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}

// DELETE: Eliminar un grupo
export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id, periodo_id } = await request.json();
    if (!id || !periodo_id) {
        return NextResponse.json({ error: "ID de grupo y periodo son requeridos" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const tables = getTableNames(periodo_id);
        
        // Eliminar asignaciones y luego el grupo
        await connection.query(`DELETE FROM ${tables.asignaciones} WHERE grupo_id = ?`, [id]);
        await connection.query(`DELETE FROM ${tables.grupos} WHERE id = ?`, [id]);
        
        await connection.commit();
        return NextResponse.json({ success: true, message: "Grupo eliminado correctamente." });

    } catch (error) {
        await connection.rollback();
        return NextResponse.json({ error: "Error al eliminar el grupo." }, { status: 500 });
    } finally {
        connection.release();
    }
}