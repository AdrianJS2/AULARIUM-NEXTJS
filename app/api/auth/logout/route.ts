import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        // Eliminamos la cookie estableciendo su tiempo de vida en el pasado
        cookies().set('authToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            expires: new Date(0), // Fecha de expiración en el pasado
            path: '/',
        });

        return NextResponse.json({ message: 'Sesión cerrada exitosamente.' });
    } catch (error) {
        console.error("Error en API de logout:", error);
        return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
    }
}