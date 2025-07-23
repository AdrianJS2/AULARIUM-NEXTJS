// app/api/users/route.ts
// Esta ruta maneja la creación (POST) y eliminación (DELETE) de usuarios.
// La lógica de Supabase Auth se ha reemplazado por la inserción directa en la tabla 'usuarios'
// y se ha añadido el hash de contraseñas con bcrypt.

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from 'uuid'; // Para generar IDs únicos
import { type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";

const SALT_ROUNDS = 10; // Número de rondas de sal para el hash de bcrypt

// --- MANEJADOR POST para crear un nuevo usuario ---
export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    // NOTA: La verificación de permisos del solicitante se manejará con NextAuth.
    // Por ahora, asumimos que quien llama a esta API tiene permisos.
    
    const { email, nombre, rol, password } = await request.json();

    if (!email || !nombre || !rol || !password) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Verificar si el usuario ya existe
    const [existingUsers]: [any[], any] = await connection.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este correo electrónico.", code: "USER_ALREADY_REGISTERED" },
        { status: 409 } // 409 Conflict es más apropiado
      );
    }

    // Hashear la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Generar un ID único para el nuevo usuario
    const userId = uuidv4();

    // Insertar el nuevo usuario en la base de datos
    await connection.query(
      "INSERT INTO usuarios (id, email, nombre, rol, password) VALUES (?, ?, ?, ?, ?)",
      [userId, email, nombre, rol, hashedPassword]
    );

    return NextResponse.json({
      success: true,
      message: "Usuario creado correctamente.",
      userId: userId
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error en la creación de usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}

// --- MANEJADOR DELETE para eliminar un usuario ---
export async function DELETE(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    // NOTA: La autenticación y autorización se implementarán con NextAuth.
    const mockAdminId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"; // Simular ID de un admin
    
    const { searchParams } = new URL(request.url);
    const userIdToDelete = searchParams.get("id");

    if (!userIdToDelete) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }
    
    // Verificar que el solicitante es un admin
    const solicitanteEsAdmin = await isAdmin(mockAdminId);
    if (!solicitanteEsAdmin) {
        return NextResponse.json({ error: "No tiene permisos para realizar esta acción" }, { status: 403 });
    }

    // Prevenir que un admin se elimine a sí mismo
    if (userIdToDelete === mockAdminId) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta de usuario.", code: "SELF_DELETION_NOT_ALLOWED" },
        { status: 403 }
      );
    }

    // Eliminar el usuario de la base de datos
    const [result]: [any, any] = await connection.query(
        "DELETE FROM usuarios WHERE id = ?",
        [userIdToDelete]
    );

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
