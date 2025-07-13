// app/api/gestion-data/[periodo]/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ADMIN_ROLES = ["admin", "administrador"];

// Función para obtener los nombres de las tablas según el periodo
const getTableNames = (periodId: string) => {
  switch (periodId) {
    case "1": return { materias: "materias_enero_abril", grupos: "grupos_enero_abril" };
    case "2": return { materias: "materias_mayo_agosto", grupos: "grupos_mayo_agosto" };
    case "3": return { materias: "materias_septiembre_diciembre", grupos: "grupos_septiembre_diciembre" };
    default: throw new Error("Periodo no válido");
  }
};

export async function GET(request: Request, { params }: { params: { periodo: string } }) {
  const periodoId = params.periodo;
  if (!periodoId || !["1", "2", "3"].includes(periodoId)) {
    return NextResponse.json({ error: "ID de periodo no válido" }, { status: 400 });
  }

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
    const tables = getTableNames(periodoId);

    // Consulta de profesores
    const [profesores] = await connection.query("SELECT id, nombre FROM profesores ORDER BY nombre ASC");

    // Consulta de materias (filtrada si no es admin)
    let materiasQuery = `SELECT * FROM ${tables.materias}`;
    const queryParams = [];
    if (!isAdmin) {
      // @ts-ignore
      materiasQuery += ` WHERE usuario_id = ?`;
       // @ts-ignore
      queryParams.push(userId);
    }
    const [materias] = await connection.query(materiasQuery, queryParams);

    // Consulta de grupos (ya filtrados por las materias obtenidas)
    // @ts-ignore
    const materiaIds = materias.length > 0 ? materias.map((m) => m.id) : [0]; // Usar [0] para evitar error de sintaxis si no hay materias
    const [grupos] = await connection.query(
      `SELECT * FROM ${tables.grupos} WHERE materia_id IN (?)`,
      [materiaIds]
    );

    return NextResponse.json({ profesores, materias, grupos });
  } catch (error: any) {
    console.error("Error en API de gestión de datos:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}