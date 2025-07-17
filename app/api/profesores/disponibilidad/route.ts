// app/api/profesores/disponibilidad/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { NextRequest } from "next/server";

// GET: Obtener la disponibilidad de un profesor específico
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const profesorId = searchParams.get('id');

    if (!profesorId) {
        return NextResponse.json({ error: "El ID del profesor es requerido" }, { status: 400 });
    }

    try {
        const [rows]: [any[], any] = await pool.query(
            "SELECT nombre, disponibilidad FROM profesores WHERE id = ?", 
            [profesorId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 });
        }

        // La disponibilidad se guarda como JSON, así que la parseamos si no es nula
        const profesor = rows[0];
        if (typeof profesor.disponibilidad === 'string') {
            profesor.disponibilidad = JSON.parse(profesor.disponibilidad);
        }
        
        return NextResponse.json(profesor);
    } catch (error: any) {
        console.error("API GET /disponibilidad Error:", error);
        return NextResponse.json({ error: "Error al obtener la disponibilidad.", details: error.message }, { status: 500 });
    }
}


// POST: Actualizar la disponibilidad de un profesor
export async function POST(request: NextRequest) {
    try {
        const { profesorId, disponibilidad } = await request.json();

        if (!profesorId || disponibilidad === undefined) {
            return NextResponse.json({ error: "ID del profesor y disponibilidad son requeridos" }, { status: 400 });
        }
        
        // Guardamos la disponibilidad como un string JSON
        const disponibilidadString = JSON.stringify(disponibilidad);

        const [result]: [any, any] = await pool.query(
            "UPDATE profesores SET disponibilidad = ? WHERE id = ?",
            [disponibilidadString, profesorId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Profesor no encontrado para actualizar." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Disponibilidad actualizada correctamente." });

    } catch (error: any) {
        console.error("API POST /disponibilidad Error:", error);
        return NextResponse.json({ error: "Error al guardar la disponibilidad.", details: error.message }, { status: 500 });
    }
}