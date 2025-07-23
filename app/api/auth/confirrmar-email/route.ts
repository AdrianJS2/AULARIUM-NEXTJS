import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Token no proporcionado." }, { status: 400 });
        }

        const [users]: any = await pool.query(
            "SELECT * FROM usuarios WHERE token_verificacion = ? AND token_expiracion > NOW()",
            [token]
        );

        if (users.length === 0) {
            return NextResponse.json({ error: "Token inválido o expirado." }, { status: 400 });
        }

        const user = users[0];

        // Marca el email como verificado y limpia el token.
        await pool.query(
            "UPDATE usuarios SET email_verificado = TRUE, token_verificacion = NULL, token_expiracion = NULL WHERE id = ?",
            [user.id]
        );

        return NextResponse.json({ message: "Correo electrónico verificado exitosamente." });

    } catch (error) {
        console.error("Error en /api/auth/confirmar-email:", error);
        return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
    }
}