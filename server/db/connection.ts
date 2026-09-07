import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password:
    process.env.DB_PASSWORD ||
    (() => {
      throw new Error("DB_PASSWORD environment variable is required.");
    })(),
  database: process.env.DB_NAME || "wii_access_portal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

export let isDbConnected = false;

export async function testDatabaseConnection() {
  try {
    const connection = await db.getConnection();
    await connection.query("SELECT 1");
    connection.release();

    isDbConnected = true;
    console.log("MySQL Database connected successfully.");
  } catch (error: any) {
    isDbConnected = false;

    console.warn(
      "MySQL Database connection unavailable. Authentication and protected APIs will remain unavailable.",
      error?.message || error,
    );
  }
}
