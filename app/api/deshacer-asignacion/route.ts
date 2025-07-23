// app/api/deshacer-asignacion/route.ts
// Esta ruta elimina todas las asignaciones para un periodo y usuario/carrera específicos.

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserRole, isAdmin } from "@/lib/auth"; // Usamos los helpers refactorizados
import { type NextRequest } from "next/server";

// NOTA: Esta ruta asumirá que la autenticación se manejará más adelante.
// Por ahora, se necesita un `userId` simulado o pasado en la solicitud para que funcione.
// En un entorno real, obtendrías el `userId` de la sesión de NextAuth.

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    // Simulamos la obtención del ID de usuario de la sesión.
    // En la Tarea B, esto se reemplazará con la sesión de NextAuth.
    const mockUserId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"; // Reemplazar con un UUID de usuario válido en tu BD.

    const { periodoId } = await request.json();

    if (!periodoId) {
      return NextResponse.json({ error: "Periodo no válido" }, { status: 400 });
    }

    const { rol, carrera_id } = await getUserRole(mockUserId);
    const admin = await isAdmin(mockUserId);

    const getTableNames = (pId: string) => {
      switch (pId) {
        case "1": return { asignaciones: "asignaciones_enero_abril", materias: "materias_enero_abril" };
        case "2": return { asignaciones: "asignaciones_mayo_agosto", materias: "materias_mayo_agosto" };
        case "3": return { asignaciones: "asignaciones_septiembre_diciembre", materias: "materias_septiembre_diciembre" };
        default: throw new Error("Periodo no válido");
      }
    };

    const tables = getTableNames(periodoId);
    
    await connection.beginTransaction();

    let deleteQuery = `DELETE FROM ${tables.asignaciones} WHERE materia_id IN (SELECT id FROM ${tables.materias} WHERE `;
    const params: (string | number)[] = [];

    if (!admin) {
      if (rol === "coordinador" && carrera_id) {
        deleteQuery += "carrera_id = ?)";
        params.push(carrera_id);
      } else {
        deleteQuery += "usuario_id = ?)";
        params.push(mockUserId);
      }
    } else {
      // Si es admin, no se filtra por usuario o carrera, se eliminan todas las del periodo.
      // La consulta se simplifica para eliminar todo lo del periodo.
      deleteQuery = `DELETE FROM ${tables.asignaciones}`;
    }

    // Solo ejecutamos la consulta de borrado si no es un admin borrando todo
    if (params.length > 0 || !admin) {
        const [result] = await connection.query(deleteQuery, params);
        console.log(`Filas eliminadas: ${(result as any).affectedRows}`);
    } else if (admin) {
        // Lógica para admin borrando todo
        const [result] = await connection.query(deleteQuery);
        console.log(`Filas eliminadas por admin: ${(result as any).affectedRows}`);
    }


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