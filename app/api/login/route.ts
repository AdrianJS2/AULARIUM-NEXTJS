import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { signToken } from "@/lib/jwt";
import cookie from "cookie";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
        }

        const [rows]: [any[], any] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);

        if (rows.length === 0) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        }

        const user = rows[0];
        const passwordIsValid = await bcrypt.compare(password, user.password);

        if (!passwordIsValid) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        }

        const token = signToken({ id: user.id, email: user.email, rol: user.rol });
        const serializedCookie = cookie.serialize("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24, // 1 día
            path: "/",
            sameSite: "lax",
        });
        
        const { password: _, ...userWithoutPassword } = user;

        return new NextResponse(JSON.stringify({ user: userWithoutPassword }), {
            status: 200,
            headers: { "Set-Cookie": serializedCookie },
        });

    } catch (error: any) {
        return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 });
    }
}