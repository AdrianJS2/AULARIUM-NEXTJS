// app/api/profesores/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ADMIN_ROLES = ["admin", "administrador"];

// GET: Obtener profesores (filtrados por usuario si no es admin)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // @ts-ignore
  const userId = session.user.id;
  // @ts-ignore
  const userRole = session.user.role;
  const isAdmin = ADMIN_ROLES.includes(userRole);
  
  const connection = await pool.getConnection();
  try {
    let query = "SELECT * FROM profesores";
    const params = [];

    if (!isAdmin) {
      query += " WHERE usuario_id = ?";
      params.push(userId);
    }
    
    query += " ORDER BY nombre ASC";
    
    const [rows] = await connection.query(query, params);
    return NextResponse.json(rows);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}

// POST: Crear un nuevo profesor
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { nombre, email } = await request.json();
    // @ts-ignore
    const userId = session.user.id;

    if (!nombre || !email) {
        return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
        const [result]: [any, any] = await connection.query(
            "INSERT INTO profesores (nombre, email, usuario_id) VALUES (?, ?, ?)",
            [nombre, email, userId]
        );
        const [rows]: [any[], any] = await connection.query("SELECT * FROM profesores WHERE id = ?", [result.insertId]);
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error: any) {
        // Manejar error de duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: "Ya existe un profesor con ese nombre o email." }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}