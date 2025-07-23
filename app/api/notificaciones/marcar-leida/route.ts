// app/api/notificaciones/marcar-leida/route.ts
// Marca una notificación específica como leída.

import { type NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de notificación no proporcionado" }, { status: 400 });
    }

    // Actualiza el estado 'leida' de la notificación.
    const [result]: [any, any] = await pool.query(
      "UPDATE notificaciones SET leida = TRUE WHERE id = ?",
      [id]
    );

    // Verifica si alguna fila fue afectada para confirmar que la notificación existía.
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error en el endpoint de marcar como leída:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  }
}