// app/api/deshacer-asignacion/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Ajusta la ruta si es necesario
import { type NextRequest } from "next/server";

// Define los roles de administrador
const ADMIN_ROLES = ["admin", "administrador"];

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    // 1. Obtener la sesión del usuario desde NextAuth
    const session = await getServerSession(authOptions);

    // 2. Verificar si hay una sesión activa
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { periodoId } = await request.json();

    if (!periodoId) {
      return NextResponse.json({ error: "Periodo no válido" }, { status: 400 });
    }

    // 3. Obtener el rol y el ID directamente desde el objeto de sesión
    // @ts-ignore
    const userRole = session.user.role;
    // @ts-ignore
    const userId = session.user.id;
    const isAdmin = ADMIN_ROLES.includes(userRole);

    const getTableNames = (pId: string) => {
      // ... (la lógica de esta función no cambia)
    };
    
    const tables = getTableNames(periodoId);
    
    await connection.beginTransaction();

    let deleteQuery = `DELETE FROM ${tables.asignaciones}`;
    const params: (string | number)[] = [];

    // 4. Aplicar la lógica de negocio usando el rol y el ID de la sesión
    if (!isAdmin) {
      // Para usuarios no-admin, siempre filtramos por su ID para seguridad.
      // Aquí asumimos que las asignaciones están vinculadas indirectamente al usuario
      // a través de las materias.
      deleteQuery += ` WHERE materia_id IN (SELECT id FROM ${tables.materias} WHERE usuario_id = ?)`;
      params.push(userId);
    }
    // Si es admin, no se añaden filtros, por lo que se eliminan todas las del periodo.

    const [result] = await connection.query(deleteQuery, params);
    // @ts-ignore
    console.log(`Filas eliminadas: ${result.affectedRows}`);

    await connection.commit();
    return NextResponse.json({ message: "Asignaciones deshechas correctamente" });

  } catch (error: any) {
    await connection.rollback();
    console.error("Error al deshacer asignaciones:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}