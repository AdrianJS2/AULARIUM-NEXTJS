// app/api/aulas/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { NextRequest } from "next/server";

// GET: Obtener todas las aulas
export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM aulas ORDER BY nombre ASC");
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener las aulas: " + error.message }, { status: 500 });
  }
}

// POST: Crear una nueva aula
export async function POST(request: NextRequest) {
  try {
    const { nombre, capacidad, equipamiento } = await request.json();

    if (!nombre || !capacidad) {
      return NextResponse.json({ error: "Nombre y capacidad son requeridos" }, { status: 400 });
    }

    const [result]: [any, any] = await pool.query(
      "INSERT INTO aulas (nombre, capacidad, equipamiento) VALUES (?, ?, ?)",
      [nombre, capacidad, equipamiento || null]
    );

    const insertId = result.insertId;
    const [rows]: [any[], any] = await pool.query("SELECT * FROM aulas WHERE id = ?", [insertId]);
    
    return NextResponse.json(rows[0], { status: 201 });

  } catch (error: any) {
    // Manejo de errores específicos de MySQL (ej. entrada duplicada)
    if (error.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: "Ya existe un aula con ese nombre." }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear el aula: " + error.message }, { status: 500 });
  }
}

// PUT: Actualizar un aula existente
export async function PUT(request: NextRequest) {
    try {
        const { id, nombre, capacidad, equipamiento } = await request.json();

        if (!id || !nombre || !capacidad) {
            return NextResponse.json({ error: "ID, nombre y capacidad son requeridos" }, { status: 400 });
        }

        await pool.query(
            "UPDATE aulas SET nombre = ?, capacidad = ?, equipamiento = ? WHERE id = ?",
            [nombre, capacidad, equipamiento || null, id]
        );

        const [rows]: [any[], any] = await pool.query("SELECT * FROM aulas WHERE id = ?", [id]);

        return NextResponse.json(rows[0]);

    } catch (error: any) {
       if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: "Ya existe un aula con ese nombre." }, { status: 409 });
        }
        return NextResponse.json({ error: "Error al actualizar el aula: " + error.message }, { status: 500 });
    }
}


// DELETE: Eliminar un aula
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "El ID del aula es requerido" }, { status: 400 });
        }

        // Antes de eliminar, desvincular de las asignaciones para mantener integridad referencial
        const tablasAsignaciones = ["asignaciones_enero_abril", "asignaciones_mayo_agosto", "asignaciones_septiembre_diciembre"];
        for (const tabla of tablasAsignaciones) {
            await pool.query(`UPDATE ${tabla} SET aula_id = NULL WHERE aula_id = ?`, [id]);
        }
        
        const [result]: [any, any] = await pool.query("DELETE FROM aulas WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Aula no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ message: "Aula eliminada correctamente" });

    } catch (error: any) {
        return NextResponse.json({ error: "Error al eliminar el aula: " + error.message }, { status: 500 });
    }
}