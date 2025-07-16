// app/api/users/change-password/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { NextRequest } from "next/server";

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Actualizamos la contraseña en nuestra tabla 'usuarios'
    // @ts-ignore
    await pool.query("UPDATE usuarios SET password = ? WHERE id = ?", [hashedPassword, session.user.id]);

    return NextResponse.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (error: any) {
    console.error("Error al cambiar contraseña:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}