// app/api/users/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from 'uuid';
import { type NextRequest } from "next/server";
import { auth } from "@/auth"; // ✅ 1. Importa la nueva función 'auth'

const SALT_ROUNDS = 10;

// --- MANEJADOR POST para crear un nuevo usuario ---
export async function POST(request: NextRequest) {
  // ✅ 2. Obtiene la sesión y verifica si el usuario es administrador
  const session = await auth();
  // @ts-ignore
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador." }, { status: 403 });
  }

  const connection = await pool.getConnection();
  try {
    const { email, nombre, rol, password } = await request.json();

    if (!email || !nombre || !rol || !password) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const [existingUsers]: [any[], any] = await connection.query("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Ya existe un usuario con este correo electrónico." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = uuidv4();

    await connection.query(
      "INSERT INTO usuarios (id, email, nombre, rol, password) VALUES (?, ?, ?, ?, ?)",
      [userId, email, nombre, rol, hashedPassword]
    );

    return NextResponse.json({ success: true, message: "Usuario creado correctamente.", userId: userId }, { status: 201 });

  } catch (error: any) {
    console.error("Error en la creación de usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}

// --- MANEJADOR DELETE para eliminar un usuario ---
export async function DELETE(request: NextRequest) {
  // ✅ 3. Obtiene la sesión y verifica si el usuario es administrador
  const session = await auth();
  // @ts-ignore
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador." }, { status: 403 });
  }

  const connection = await pool.getConnection();
  try {
    const { searchParams } = new URL(request.url);
    const userIdToDelete = searchParams.get("id");

    if (!userIdToDelete) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    // Prevenir que un admin se elimine a sí mismo
    // @ts-ignore
    if (userIdToDelete === session.user.id) {
      return NextResponse.json({ error: "No puedes eliminar tu propia cuenta de administrador." }, { status: 403 });
    }

    const [result]: [any, any] = await connection.query("DELETE FROM usuarios WHERE id = ?", [userIdToDelete]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Usuario eliminado correctamente." });

  } catch (error: any) {
    console.error("Error en la eliminación de usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}