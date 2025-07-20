import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/jwt";
import * as cookie from "cookie";
import type { NextRequest } from "next/server";
export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
        }

        // 1. Buscar al usuario por email en la base de datos MySQL.
        const [rows]: [any[], any] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);

        if (rows.length === 0) {
            // Si no se encuentra el usuario, devuelve un error.
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        }

        const user = rows[0];

        // 2. Comparar la contraseña proporcionada con el hash guardado en la base de datos.
        const passwordIsValid = await bcrypt.compare(password, user.password);

        if (!passwordIsValid) {
            // Si la contraseña no coincide, devuelve un error.
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        }

        // 3. Si las credenciales son válidas, crear un token de sesión (JWT).
        const token = signToken({ id: user.id, email: user.email, rol: user.rol });
        
        // 4. Guardar el token en una cookie segura (HttpOnly).
        const serializedCookie = cookie.serialize("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24, // 1 día
            path: "/",
            sameSite: "lax",
        });
        
        // Excluimos la contraseña del objeto de usuario que devolvemos al frontend.
        const { password: _, ...userWithoutPassword } = user;

        // 5. Devolver una respuesta exitosa con los datos del usuario y la cookie de sesión.
        return new NextResponse(JSON.stringify({ user: userWithoutPassword }), {
            status: 200,
            headers: { "Set-Cookie": serializedCookie },
        });

    } catch (error: any) {
        console.error("API /api/auth/login Error:", error);
        return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 });
    }
}