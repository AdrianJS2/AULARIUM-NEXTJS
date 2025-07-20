import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        const connection = await pool.getConnection();

        const [rows]: [any[], any] = await connection.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            connection.release();
            return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            connection.release();
            return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
        }
        
        // Creamos el token JWT
        const token = jwt.sign(
            { userId: user.id, rol: user.rol },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' } // El token expira en 1 día
        );

        // Guardamos el token en una cookie HttpOnly
        cookies().set('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 día en segundos
            path: '/',
        });
        
        connection.release();
        
        // Devolvemos el usuario sin la contraseña
        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json({ user: userWithoutPassword });

    } catch (error) {
        console.error("Error en API de login:", error);
        return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
    }
}