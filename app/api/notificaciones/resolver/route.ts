// app/api/notificaciones/resolver/route.ts
// Resuelve una notificación y envía una notificación de respuesta.
// Utiliza transacciones para garantizar la integridad de los datos.

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Obtenemos una conexión del pool para poder usar transacciones.
  const connection = await pool.getConnection();
  
  try {
    // Iniciamos la transacción.
    await connection.beginTransaction();

    const { notificacionId, remitenteId, periodo } = await request.json();

    if (!notificacionId) {
      return NextResponse.json({ error: "ID de notificación no proporcionado" }, { status: 400 });
    }

    // 1. Obtenemos la notificación original.
    const [notificacionRows]: [any[], any] = await connection.query(
      "SELECT * FROM notificaciones WHERE id = ?",
      [notificacionId]
    );

    if (notificacionRows.length === 0) {
      await connection.rollback(); // Deshacemos la transacción si no se encuentra la notificación.
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }
    const notificacion = notificacionRows[0];
    
    // El campo 'datos' es JSON, lo parseamos si es un string.
    const datos = typeof notificacion.datos === 'string' ? JSON.parse(notificacion.datos) : notificacion.datos;

    // 2. Lógica para encontrar al remitente.
    let remitente = remitenteId || notificacion.remitente_id;
    if (!remitente && datos?.solicitante?.id) {
      remitente = datos.solicitante.id;
    }

    if (!remitente) {
      const [directores]: [any[], any] = await connection.query(
        "SELECT id FROM usuarios WHERE rol = 'director' LIMIT 1"
      );
      if (directores.length > 0) {
        remitente = directores[0].id;
      }
    }

    // 3. Marcamos la notificación actual como resuelta y leída.
    await connection.query(
      "UPDATE notificaciones SET resuelta = TRUE, leida = TRUE WHERE id = ?",
      [notificacionId]
    );

    // 4. Si encontramos un remitente, creamos una notificación de respuesta.
    if (remitente) {
      const mensajeRespuesta = `Tu solicitud de asignación de aulas para el periodo ${periodo || datos?.periodo || ""} ha sido resuelta`;
      const datosRespuesta = {
        notificacionOriginalId: notificacionId,
        periodo: periodo || datos?.periodo,
      };

      const [insertResult]: [any, any] = await connection.query(
        "INSERT INTO notificaciones (tipo, mensaje, datos, destinatario_id) VALUES (?, ?, ?, ?)",
        ["SOLICITUD_RESUELTA", mensajeRespuesta, JSON.stringify(datosRespuesta), remitente]
      );
      
      const nuevaNotificacionId = insertResult.insertId;
      const [nuevaNotificacionRows]: [any[], any] = await connection.query(
          "SELECT * FROM notificaciones WHERE id = ?",
          [nuevaNotificacionId]
      );
      
      // Si todo fue exitoso, confirmamos la transacción.
      await connection.commit();
      return NextResponse.json({
        success: true,
        message: "Notificación marcada como resuelta y respuesta enviada al remitente",
        notificacion: nuevaNotificacionRows[0],
      });
    } else {
      // Si no hay remitente, igual confirmamos la transacción del UPDATE.
      await connection.commit();
      return NextResponse.json({
        success: true,
        message: "Notificación marcada como resuelta (no se pudo enviar respuesta al remitente)",
      });
    }
  } catch (error: any) {
    // Si ocurre cualquier error, deshacemos todos los cambios.
    await connection.rollback();
    console.error("Error en el endpoint de resolver notificación:", error);
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 });
  } finally {
    // Liberamos la conexión para que pueda ser reutilizada.
    connection.release();
  }
}