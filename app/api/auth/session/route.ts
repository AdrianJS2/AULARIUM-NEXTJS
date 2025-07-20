import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers'; // Usamos cookies para el token
import pool from '@/lib/db';

export async function GET() {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
        return NextResponse.json({ error: 'No autorizado: No hay token.' }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

        const [rows]: [any[], any] = await pool.query(
            'SELECT id, nombre, email, rol, carrera_id FROM usuarios WHERE id = ?',
            [decoded.userId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'No autorizado: Usuario no encontrado.' }, { status: 401 });
        }

        const user = rows[0];
        
        // No devolvemos la contraseña, solo los datos necesarios
        return NextResponse.json({ user });

    } catch (error) {
        // Esto captura tokens expirados o inválidos
        return NextResponse.json({ error: 'No autorizado: Token inválido o expirado.' }, { status: 401 });
    }
}