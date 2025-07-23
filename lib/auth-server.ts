// RUTA: lib/auth-server.ts

import pool from "@/lib/db";

/**
 * Obtiene el rol y el ID de la carrera de un usuario directamente desde la base de datos.
 * Esta función está diseñada para ser usada SOLO en el lado del servidor (API Routes, etc.).
 */
export async function getUserRole(userId: string) {
    try {
        const [rows]: [any[], any] = await pool.query(
            "SELECT rol, carrera_id FROM usuarios WHERE id = ?",
            [userId]
        );

        if (rows.length === 0) {
            return { rol: null, carrera_id: null };
        }
        return { rol: rows[0].rol, carrera_id: rows[0].carrera_id };
    } catch (error) {
        console.error("Error fetching user role on server:", error);
        // En caso de error, devolvemos un estado seguro.
        return { rol: null, carrera_id: null };
    }
}

/**
 * Verifica si un usuario es administrador directamente desde la base de datos.
 * Esta función está diseñada para ser usada SOLO en el lado del servidor.
 */
export async function isAdmin(userId: string): Promise<boolean> {
    try {
        const [rows]: [any[], any] = await pool.query(
            "SELECT rol FROM usuarios WHERE id = ?",
            [userId]
        );

        if (rows.length === 0) {
            return false;
        }
        const userRole = rows[0].rol;
        // Hacemos la comparación insensible a mayúsculas para más robustez.
        return userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'administrador';
    } catch (error) {
        console.error("Error checking admin status on server:", error);
        return false;
    }
}