import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Tu conexión a la base de datos
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { userId, currentPassword, newPassword } = await req.json();

        if (!userId || !currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Faltan datos requeridos.' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // 1. Obtener el hash de la contraseña actual del usuario desde la BD
        const [rows]: [any[], any] = await connection.query(
            'SELECT password FROM usuarios WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            connection.release();
            return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
        }

        const user = rows[0];
        const currentPasswordHash = user.password;

        // 2. Comparar la contraseña actual proporcionada con el hash de la BD
        const isMatch = await bcrypt.compare(currentPassword, currentPasswordHash);

        if (!isMatch) {
            connection.release();
            return NextResponse.json({ error: 'La contraseña actual es incorrecta.' }, { status: 401 });
        }

        // 3. Si coincide, crear un nuevo hash para la nueva contraseña
        const newSalt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, newSalt);

        // 4. Actualizar la contraseña en la base de datos
        await connection.query(
            'UPDATE usuarios SET password = ? WHERE id = ?',
            [newPasswordHash, userId]
        );

        connection.release();

        return NextResponse.json({ message: 'Contraseña actualizada con éxito.' }, { status: 200 });

    } catch (error: any) {
        console.error('Error en change-password API:', error);
        return NextResponse.json({ error: 'Error interno del servidor.', details: error.message }, { status: 500 });
    }
}