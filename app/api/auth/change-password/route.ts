

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';


interface TokenPayload {
    id: string;
}


export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
       
        const token = cookies().get('authToken')?.value;
        if (!token) {
            return NextResponse.json({ error: 'No autorizado: sesión no encontrada.' }, { status: 401 });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
        const userId = decoded.id;

        // 2. Get passwords from the request body
        const { currentPassword, newPassword } = await request.json();
        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Faltan la contraseña actual o la nueva.' }, { status: 400 });
        }

        // 3. Get the user's current hashed password from the DB
        const [rows]: any = await pool.query(
            "SELECT password FROM usuarios WHERE id = ?",
            [userId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'La contraseña actual es incorrecta.' }, { status: 401 });
        }

        // 4. Hash the new password and update the database
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await pool.query(
            "UPDATE usuarios SET password = ? WHERE id = ?",
            [newPasswordHash, userId]
        );

        return NextResponse.json({ message: 'Contraseña actualizada correctamente.' });

    } catch (error: any) {
        console.error("Error en /api/auth/change-password:", error);
        // Handle specific JWT errors
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}