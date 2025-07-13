// lib/db.ts
import mysql from 'mysql2/promise';

// Crea un "pool" de conexiones para ser reutilizado
// Las credenciales se leen desde variables de entorno para mayor seguridad
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Exporta el pool para que pueda ser usado en otras partes de la aplicación
export default pool;
