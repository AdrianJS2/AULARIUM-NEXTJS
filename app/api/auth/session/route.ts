// RUTA: app/api/auth/session/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

interface TokenPayload {
    id: string;
    email: string;
    rol: string;
}

// ✅ ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ PRESENTE
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const token = cookies().get('authToken')?.value;

        if (!token) {
            return NextResponse.json({ user: null });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;

        const [rows]: any = await pool.query(
            "SELECT id, email, rol, nombre, carrera_id FROM usuarios WHERE id = ?",
            [decoded.id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({ user: rows[0] });

    } catch (error) {
        console.error("Error en ruta de sesión (token inválido/expirado):", error);
        return NextResponse.json({ user: null });
    }
}