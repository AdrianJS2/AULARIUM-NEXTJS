// app/api/asignar-aulas/enero-abril/route.ts
// Esta es la ruta refactorizada para el periodo Enero-Abril.
// Las otras dos rutas ('mayo-agosto' y 'septiembre-diciembre') seguirían este mismo patrón.

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { isAdmin, getUserRole } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const { aulas, carreraId } = await request.json();

    // Simulación del ID de usuario (reemplazar con la sesión de NextAuth en la Tarea B)
    const mockUserId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"; 
    
    const admin = await isAdmin(mockUserId);
    const { rol, carrera_id } = await getUserRole(mockUserId);

    // --- Inicio de la Transacción ---
    await connection.beginTransaction();

    // 1. Obtener materias según el rol y la carrera
    let materiasQuery = "SELECT * FROM materias_enero_abril";
    const params: (string | number)[] = [];
    
    if (!admin) {
      if (rol === 'coordinador' && carrera_id) {
        materiasQuery += " WHERE carrera_id = ?";
        params.push(carrera_id);
      } else {
        materiasQuery += " WHERE usuario_id = ?";
        params.push(mockUserId);
      }
    } else if (carreraId) {
        materiasQuery += " WHERE carrera_id = ?";
        params.push(carreraId);
    }
    
    const [materias]: [any[], any] = await connection.query(materiasQuery, params);
    if (materias.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: "No hay materias disponibles para asignar" }, { status: 404 });
    }

    // 2. Obtener grupos de esas materias
    const materiaIds = materias.map((m: any) => m.id);
    const [grupos]: [any[], any] = await connection.query(
      "SELECT * FROM grupos_enero_abril WHERE materia_id IN (?)",
      [materiaIds]
    );

    if (grupos.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: "No hay grupos disponibles para asignar" }, { status: 404 });
    }

    // 3. Eliminar asignaciones existentes para estos grupos
    const grupoIds = grupos.map((g: any) => g.id);
    await connection.query("DELETE FROM asignaciones_enero_abril WHERE grupo_id IN (?)", [grupoIds]);

    // 4. Algoritmo de asignación (lógica de JS, no cambia)
    const gruposConHorarios = grupos.map((grupo: any) => ({
      ...grupo,
      horarios: Array.isArray(grupo.horarios) ? grupo.horarios : JSON.parse(grupo.horarios || "[]"),
    }));
    
    gruposConHorarios.sort((a: any, b: any) => b.alumnos - a.alumnos);

    const asignaciones = [];
    for (const grupo of gruposConHorarios) {
      for (const horario of grupo.horarios) {
        const materia = materias.find((m: any) => m.id === grupo.materia_id);
        if (!materia) continue;

        const aulasDisponiblesParaHorario = aulas.filter((aula: any) => {
          const aulaOcupada = asignaciones.some(
            (a: any) =>
              a.aula_id === aula.id &&
              a.dia === horario.dia &&
              ((a.hora_inicio <= horario.hora_inicio && a.hora_fin > horario.hora_inicio) ||
                (a.hora_inicio < horario.hora_fin && a.hora_fin >= horario.hora_fin))
          );
          return !aulaOcupada && aula.capacidad >= grupo.alumnos;
        });
        
        aulasDisponiblesParaHorario.sort((a: any, b: any) => a.capacidad - b.capacidad);
        const aulaAsignada = aulasDisponiblesParaHorario.find((aula: any) => aula.capacidad >= grupo.alumnos);

        asignaciones.push([
          grupo.id,
          aulaAsignada?.id || null,
          grupo.materia_id,
          horario.dia,
          horario.hora_inicio,
          horario.hora_fin,
          grupo.turno,
          materia.carrera_id || null,
        ]);
      }
    }

    // 5. Insertar nuevas asignaciones
    if (asignaciones.length > 0) {
      await connection.query(
        "INSERT INTO asignaciones_enero_abril (grupo_id, aula_id, materia_id, dia, hora_inicio, hora_fin, turno, carrera_id) VALUES ?",
        [asignaciones]
      );
    }
    
    // --- Fin de la Transacción ---
    await connection.commit();

    const [insertedData] = await pool.query("SELECT * FROM asignaciones_enero_abril WHERE grupo_id IN (?)", [grupoIds]);

    return NextResponse.json(insertedData);

  } catch (error: any) {
    await connection.rollback();
    console.error("Error en asignación de aulas:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}