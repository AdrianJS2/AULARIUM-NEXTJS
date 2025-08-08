import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from 'uuid';
import { type NextRequest } from "next/server";

const SALT_ROUNDS = 10;

// --- MANEJADOR GET para obtener todos los usuarios ---
export async function GET(request: NextRequest) {
  // Aquí podrías añadir una verificación de rol si no quieres que cualquiera vea los usuarios
  try {
    // Unimos las tablas usuarios y carreras para obtener el nombre de la carrera
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.rol, u.carrera_id, c.nombre as carrera_nombre 
       FROM usuarios u 
       LEFT JOIN carreras c ON u.carrera_id = c.id
       ORDER BY u.nombre ASC`
    );
    return NextResponse.json({ users: rows });
  } catch (error: any) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  }
}

// --- MANEJADOR POST para crear un nuevo usuario ---
export async function POST(request: NextRequest) {
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

// --- MANEJADOR PUT para actualizar un usuario ---
export async function PUT(request: NextRequest) {
    const connection = await pool.getConnection();
    try {
        const { id, nombre, rol } = await request.json();

        if (!id || !nombre || !rol) {
            return NextResponse.json({ error: "Faltan campos obligatorios para actualizar" }, { status: 400 });
        }
        
        const [result]: [any, any] = await connection.query(
            "UPDATE usuarios SET nombre = ?, rol = ? WHERE id = ?",
            [nombre, rol, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Usuario actualizado correctamente." });

    } catch (error: any) {
        console.error("Error en la actualización de usuario:", error);
        return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}


// --- MANEJADOR DELETE para eliminar un usuario ---
export async function DELETE(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const { searchParams } = new URL(request.url);
    const userIdToDelete = searchParams.get("id");

    if (!userIdToDelete) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
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
