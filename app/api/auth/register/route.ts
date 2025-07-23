import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Resend } from "resend";
import { v4 as uuidv4 } from 'uuid';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { nombre, email, password } = await req.json();

    if (!nombre || !email || !password || password.length < 6) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    }

    const [existingUser]: any = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Este correo ya está registrado." }, { status: 409 });
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiration = new Date(Date.now() + 3600 * 1000 * 24);

    await pool.query(
      "INSERT INTO usuarios (id, nombre, email, password, rol, token_verificacion, token_expiracion) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, nombre, email, passwordHash, 'usuario', verificationToken, tokenExpiration]
    );

    const confirmationUrl = `http://localhost:3000/auth/confirmar?token=${verificationToken}`;

    // ✅ AÑADIMOS LOGS PARA DEPURAR
    console.log("Intentando enviar correo a:", email);
    const { data, error } = await resend.emails.send({
      from: 'Aularium <onboarding@resend.dev>',
      to: email,
      subject: 'Confirma tu cuenta en Aularium',
      html: `<p>Haz clic en el siguiente enlace para confirmar tu cuenta:</p><a href="${confirmationUrl}">Confirmar cuenta</a>`
    });

    if (error) {
        console.error("Error al enviar correo desde Resend:", error);
        // Aunque el correo falle, el usuario ya fue creado. Devolvemos éxito pero avisamos del error en consola.
        // En un entorno de producción, podrías querer manejar esto de forma más robusta (ej. reintentar).
        return NextResponse.json({ message: "Registro exitoso, pero hubo un problema al enviar el correo de confirmación." }, { status: 201 });
    }

    console.log("Correo enviado exitosamente, respuesta de Resend:", data);

    return NextResponse.json({ message: "Registro exitoso. Revisa tu correo para activar tu cuenta." }, { status: 201 });

  } catch (error) {
    console.error("Error en /api/auth/register:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}