import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db'; // Asegúrate de que la importación sea la correcta para tu configuración

// Interfaz para el payload del token
interface TokenPayload {
  id: string;
  [key: string]: any;
}

// Estas dos líneas fuerzan a la ruta a no usar ningún tipo de caché y a
// ejecutarse en el servidor en cada petición. Esto es correcto.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ✅ CORRECCIÓN: La función GET ahora recibe el objeto `request`.
export async function GET(request: NextRequest) {
  try {
    // ✅ CORRECCIÓN: Leemos la cookie directamente del objeto `request`.
    // Esto es más directo y soluciona el error que estabas viendo.
    const token = request.cookies.get('authToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado: Falta el token.' }, { status: 401 });
    }

    // Usamos un bloque try...catch solo para la verificación del token
    let decoded: TokenPayload;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (jwtError) {
        // Si el token es inválido (expirado, malformado), devolvemos un error claro.
        return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 });
    }
    
    const [rows]: any = await pool.query(
      'SELECT id, email, rol, nombre FROM usuarios WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ user: rows[0] });

  } catch (error) {
    // Este catch atrapará errores de la base de datos o cualquier otro imprevisto.
    console.error("Error crítico en /api/auth/session:", error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
