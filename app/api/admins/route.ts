// app/api/admins/route.ts
// Ruta de API para obtener todos los usuarios con el rol de "admin".

import { type NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db"; // Importamos el nuevo módulo de conexión

export async function GET(request: NextRequest) {
  try {
    // Ejecutamos una consulta SQL directa usando el pool de conexiones.
    // Usamos '?' como marcador de posición para evitar inyección de SQL.
    const [rows] = await pool.query(
      "SELECT id, email, nombre FROM usuarios WHERE rol = ?", 
      ['admin']
    );

    // Devolvemos los resultados en el formato esperado por el frontend.
    return NextResponse.json({ admins: rows });

  } catch (error: any) {
    console.error("Error en la API de administradores:", error);
    return NextResponse.json(
      { error: "Error interno del servidor: " + error.message }, 
      { status: 500 }
    );
  }
}
