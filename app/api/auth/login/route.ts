import { NextResponse } from "next/server";
import  pool  from "@/lib/db"; // Asegúrate de que la importación sea la correcta
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos." }, { status: 400 });
    }

    const [rows]: any = await pool.query(
      "SELECT id, email, rol, nombre, password, email_verificado FROM usuarios WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
    }

    const user = rows[0];

    // ✅ PASO DE DIAGNÓSTICO:
    // Este log nos mostrará en la consola del servidor el valor exacto que llega de la DB.
    console.log(`Verificando usuario: ${user.email}, email_verificado:`, user.email_verificado, `(Tipo: ${typeof user.email_verificado})`);

    // ✅ CORRECCIÓN LÓGICA:
    // Comparamos explícitamente contra 0. Esto es más seguro que !user.email_verificado.
    if (user.email_verificado == 0) {
        return NextResponse.json({ 
            error: "Tu cuenta no ha sido verificada. Por favor, revisa tu correo electrónico.",
            resendNeeded: true 
        }, { status: 403 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
    }

    // Creamos el token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    // Guardamos el token en una cookie HttpOnly

    // cookies().set('authToken', token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'strict',
    //   maxAge: 60 * 60 * 24, // 1 día
    //   path: '/',
    // });
    // Versión temporal para HTTP (sin Secure)
const isHttps = process.env.NEXTAUTH_URL?.startsWith('https');

cookies().set('authToken', token, {
  httpOnly: true,
  secure: Boolean(isHttps), // solo true si usas HTTPS
  sameSite: 'lax',          // menos estricto que 'strict'
  path: '/',
  maxAge: 60 * 60 * 24,     // 1 día
});

    return NextResponse.json({ message: "Inicio de sesión exitoso." });

  } catch (error) {
    console.error("Error en /api/auth/login:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}