// app/api/horarios-data/[periodo]/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Esta función se encargará de obtener todos los datos para un periodo específico
export async function GET(request: Request, { params }: { params: { periodo: string } }) {
  const periodoId = params.periodo;
  const connection = await pool.getConnection();

  try {
    const getTableNames = (pId: string) => {
      switch (pId) {
        case "1": return { materias: "materias_enero_abril", grupos: "grupos_enero_abril", asignaciones: "asignaciones_enero_abril" };
        case "2": return { materias: "materias_mayo_agosto", grupos: "grupos_mayo_agosto", asignaciones: "asignaciones_mayo_agosto" };
        case "3": return { materias: "materias_septiembre_diciembre", grupos: "grupos_septiembre_diciembre", asignaciones: "asignaciones_septiembre_diciembre" };
        default: throw new Error("Periodo no válido");
      }
    };

    const tables = getTableNames(periodoId);

    // Hacemos todas las consultas necesarias en paralelo
    const [aulas] = await connection.query("SELECT * FROM aulas");
    const [materias] = await connection.query(`SELECT * FROM ${tables.materias}`);
    const [grupos] = await connection.query(`SELECT * FROM ${tables.grupos}`);
    const [asignaciones] = await connection.query(`SELECT * FROM ${tables.asignaciones}`);

    return NextResponse.json({ aulas, materias, grupos, asignaciones });

  } catch (error: any) {
    console.error("Error fetching horario data:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}