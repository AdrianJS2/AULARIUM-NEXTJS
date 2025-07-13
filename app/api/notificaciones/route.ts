// app/api/notificaciones/route.ts
// Maneja la creación (POST) y obtención (GET) de notificaciones.

import { type NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// --- MANEJADOR POST para crear una nueva notificación ---
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validación de campos requeridos.
    if (!data.tipo || !data.mensaje || !data.destinatario_id) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // El objeto 'datos' se convierte a un string JSON para almacenarlo en la base de datos.
    const datosJson = JSON.stringify(data.datos || {});

    // Inserción de la nueva notificación.
    const [result]: [any, any] = await pool.query(
      "INSERT INTO notificaciones (tipo, mensaje, datos, destinatario_id, remitente_id) VALUES (?, ?, ?, ?, ?)",
      [data.tipo, data.mensaje, datosJson, data.destinatario_id, data.remitente_id || null]
    );

    const insertId = result.insertId;

    // Se recupera la notificación recién creada para devolverla completa.
    const [rows]: [any[], any] = await pool.query("SELECT * FROM notificaciones WHERE id = ?", [insertId]);

    return NextResponse.json(rows[0]);

  } catch (error: any) {
    console.error("Error en API de notificaciones (POST):", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  }
}

// --- MANEJADOR GET para obtener las notificaciones de un usuario ---
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Se requiere el ID de usuario" }, { status: 400 });
    }

    // Consulta para obtener las notificaciones ordenadas por fecha.
    const [rows] = await pool.query(
      "SELECT * FROM notificaciones WHERE destinatario_id = ? ORDER BY fecha_creacion DESC",
      [userId]
    );

    return NextResponse.json(rows || []);

  } catch (error: any) {
    console.error("Error en API de notificaciones (GET):", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  }
}