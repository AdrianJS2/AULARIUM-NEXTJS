// app/api/profesores/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { NextRequest } from "next/server";

// GET: Obtener todos los profesores
export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM profesores ORDER BY nombre ASC");
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("API GET /api/profesores Error:", error);
    return NextResponse.json({ error: "Error al obtener los profesores.", details: error.message }, { status: 500 });
  }
}

// POST: Crear un nuevo profesor
export async function POST(request: NextRequest) {
  try {
    const { nombre, email, disponibilidad, usuario_id } = await request.json();

    if (!nombre || !email) {
      return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 });
    }
    
    // El usuario_id y la disponibilidad son opcionales
    const [result]: [any, any] = await pool.query(
      "INSERT INTO profesores (nombre, email, disponibilidad, usuario_id) VALUES (?, ?, ?, ?)",
      [nombre, email, disponibilidad ? JSON.stringify(disponibilidad) : null, usuario_id || null]
    );

    const insertId = result.insertId;
    const [rows]: [any[], any] = await pool.query("SELECT * FROM profesores WHERE id = ?", [insertId]);
    
    return NextResponse.json(rows[0], { status: 201 });

  } catch (error: any){
    console.error("API POST /api/profesores Error:", error);
    if (error.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: "Ya existe un profesor con ese email." }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear el profesor.", details: error.message }, { status: 500 });
  }
}



// PUT: Actualizar un profesor
export async function PUT(request: NextRequest) {
    try {
        const { id, nombre, email, disponibilidad } = await request.json();

        if (!id || !nombre || !email) {
            return NextResponse.json({ error: "ID, nombre y email son requeridos" }, { status: 400 });
        }

        const [result]: [any, any] = await pool.query(
            "UPDATE profesores SET nombre = ?, email = ?, disponibilidad = ? WHERE id = ?",
            [nombre, email, disponibilidad ? JSON.stringify(disponibilidad) : null, id]
        );
        
        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Profesor no encontrado para actualizar." }, { status: 404 });
        }

        const [rows]: [any[], any] = await pool.query("SELECT * FROM profesores WHERE id = ?", [id]);
        return NextResponse.json(rows[0]);

    } catch (error: any) {
        console.error("API PUT /api/profesores Error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: "Ya existe un profesor con ese email." }, { status: 409 });
        }
        return NextResponse.json({ error: "Error al actualizar el profesor.", details: error.message }, { status: 500 });
    }
}

// DELETE: Eliminar un profesor
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: "El ID del profesor es requerido" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Desvincular al profesor de todas las tablas de materias
        const tablasMaterias = ["materias_enero_abril", "materias_mayo_agosto", "materias_septiembre_diciembre"];
        for (const tabla of tablasMaterias) {
             try {
                await connection.query(`UPDATE ${tabla} SET profesor_id = NULL WHERE profesor_id = ?`, [id]);
             } catch (e: any) {
                if (e.code !== 'ER_NO_SUCH_TABLE') throw e;
            }
        }
        
        // Eliminar al profesor
        const [result]: [any, any] = await connection.query("DELETE FROM profesores WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 });
        }

        await connection.commit();
        return NextResponse.json({ message: "Profesor eliminado correctamente" });

    } catch (error: any) {
        await connection.rollback();
        console.error("API DELETE /api/profesores Error:", error);
        return NextResponse.json({ error: "Error al eliminar el profesor.", details: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}