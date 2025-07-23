import mysql from 'mysql2/promise';

// Declaramos una variable global para 'cachear' la conexión.
// Esto es específico para evitar crear múltiples conexiones en el entorno de desarrollo de Next.js.
declare global {
  var poolCache: mysql.Pool | undefined;
}

let pool: mysql.Pool;

// Si estamos en un entorno que no es producción y ya tenemos una conexión cacheada, la reutilizamos.
if (process.env.NODE_ENV !== 'production' && global.poolCache) {
  pool = global.poolCache;
} else {
  // Si no, creamos una nueva conexión.
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Si no estamos en producción, guardamos la nueva conexión en el caché global.
  if (process.env.NODE_ENV !== 'production') {
    global.poolCache = pool;
  }
}

// ✅ Correcto: Usamos la exportación por defecto que tus archivos esperan.
export default pool;