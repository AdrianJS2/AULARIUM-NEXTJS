// app/api/check-admin/route.ts
// Ruta para verificar si un usuario específico tiene rol de administrador.

import { type NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// Se define el rol de administrador para mantener la lógica centralizada.
const ADMIN_ROLE = "admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Se requiere userId" }, { status: 400 });
    }

    // Ejecutamos la consulta para obtener el rol del usuario.
    const [rows]: [any[], any] = await pool.query(
      "SELECT rol FROM usuarios WHERE id = ?",
      [userId]
    );

    // Verificamos si se encontró el usuario.
    if (rows.length === 0) {
      return NextResponse.json({ isAdmin: false, role: null }, { status: 404 });
    }

    const user = rows[0];
    const isAdmin = user.rol === ADMIN_ROLE;

    console.log("Verificación de admin para userId:", userId, "resultado:", isAdmin);

    return NextResponse.json({
      isAdmin: isAdmin,
      role: user.rol,
    });

  } catch (error: any) {
    console.error("Error en check-admin API:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  }
}