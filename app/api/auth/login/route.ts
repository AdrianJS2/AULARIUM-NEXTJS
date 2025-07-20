// RUTA: app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // ✅ CORRECCIÓN: Cambiamos 'password_hash' a 'password' para que coincida con tu tabla.
        const [rows]: any = await pool.query(
            "SELECT id, email, rol, nombre, carrera_id, password FROM usuarios WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
        }

        const user = rows[0];

        // ✅ CORRECCIÓN: Usamos 'user.password' para la comparación.
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
        }

        // Crear el payload para el token (sin datos sensibles)
        const tokenPayload = {
            id: user.id,
            email: user.email,
            rol: user.rol,
        };

        // Firmar el token JWT
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET as string, {
            expiresIn: '7d',
        });

        // Guardamos el token en una cookie HttpOnly
        cookies().set('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 días en segundos
        });

        // Devolver solo los datos necesarios del usuario al frontend
        const userToReturn = {
            id: user.id,
            email: user.email,
            rol: user.rol,
            nombre: user.nombre,
            carrera_id: user.carrera_id
        };

        return NextResponse.json({ user: userToReturn });

    } catch (error) {
        console.error("Error en /api/auth/login:", error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}