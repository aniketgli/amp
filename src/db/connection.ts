import mysql from 'mysql2/promise';

// Optional MySQL Connection Pool (Lazy initialized)
let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT) || 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'wii_access_portal';

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    });
  }
  return pool;
}

// Helper to test database connection health
export async function testDatabaseConnection() {
  try {
    const db = getDbPool();
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    return { connected: true, details: rows };
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}
