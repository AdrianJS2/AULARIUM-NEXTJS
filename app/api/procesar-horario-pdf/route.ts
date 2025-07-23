// app/api/procesar-horario-pdf/route.ts
// Esta ruta procesa el texto de un PDF y verifica si existen duplicados
// de profesores o materias en la base de datos antes de la inserción.

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { NextRequest } from "next/server";

// La función para procesar el texto del PDF no necesita cambios,
// ya que no interactúa con la base de datos.
function procesarTextoPDF(texto: string) {
  // ... (Lógica de extracción de texto existente, sin cambios)
  const materiasEjemplo = ["CÁLCULO DIFERENCIAL", "ÁLGEBRA LINEAL", "ESTRUCTURA DE DATOS"];
  const profesoresEjemplo = ["Juan Pérez", "María Rodríguez", "Carlos López"];
  const gruposEjemplo = ["01AM", "02BT"];
  
  const materias = materiasEjemplo.map((nombre, index) => ({ nombre, profesor_id: index + 1 }));
  const profesores = profesoresEjemplo.map(nombre => ({ nombre, email: `${nombre.toLowerCase().replace(/\s/g, '.')}@example.com` }));
  const grupos = gruposEjemplo.map((numero, index) => ({
      numero,
      materia_id: index + 1,
      alumnos: 30,
      turno: numero.includes('AM') ? 'MAÑANA' : 'TARDE',
      horarios: [{ dia: 'Lunes', hora_inicio: '08:00', hora_fin: '10:00' }]
  }));

  return { materias, profesores, grupos };
}

const getTableNamesByPeriod = (periodId: string) => {
    switch (periodId) {
        case "1": return { materias: "materias_enero_abril" };
        case "2": return { materias: "materias_mayo_agosto" };
        case "3": return { materias: "materias_septiembre_diciembre" };
        default: throw new Error("Periodo no válido");
    }
};

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const periodoId = formData.get("periodoId") as string;

    if (!file || !periodoId) {
      return NextResponse.json({ error: "Archivo o periodo no proporcionado" }, { status: 400 });
    }

    // Simulamos la extracción de texto del PDF.
    const textoSimulado = "Texto extraído del PDF...";
    const { materias, profesores, grupos } = procesarTextoPDF(textoSimulado);

    const duplicates = [];

    // 1. Verificar profesores duplicados
    for (const profesor of profesores) {
      const [rows]: [any[], any] = await connection.query(
        "SELECT id, nombre FROM profesores WHERE nombre LIKE ?",
        [`%${profesor.nombre}%`]
      );
      if (rows.length > 0) {
        duplicates.push({
          type: "profesor",
          name: profesor.nombre,
          existingId: rows[0].id,
          action: "skip",
        });
      }
    }

    // 2. Verificar materias duplicadas
    const tables = getTableNamesByPeriod(periodoId);
    for (const materia of materias) {
      const [rows]: [any[], any] = await connection.query(
        `SELECT id, nombre FROM ${tables.materias} WHERE nombre LIKE ?`,
        [`%${materia.nombre}%`]
      );
      if (rows.length > 0) {
        duplicates.push({
          type: "materia",
          name: materia.nombre,
          existingId: rows[0].id,
          action: "skip",
        });
      }
    }
    
    // Si hay duplicados, se devuelve la lista para que el usuario decida.
    if (duplicates.length > 0) {
      return NextResponse.json({
        duplicates,
        results: { materias, profesores, grupos },
        periodoId,
      });
    }

    // Si no hay duplicados, se podría proceder a insertar directamente (lógica simplificada).
    // La lógica de inserción completa se encuentra en la ruta 'confirm'.
    return NextResponse.json({
      success: true,
      stats: { profesores: 0, materias: 0, grupos: 0 }, // Simulado
      results: { materias, profesores, grupos },
      periodoId,
    });

  } catch (error: any) {
    console.error("Error al procesar PDF:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}