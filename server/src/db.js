import mysql from "mysql2/promise";
import "dotenv/config";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "preppilot_ai",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function testDatabaseConnection() {
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(
      "SELECT DATABASE() AS databaseName"
    );

    console.log(
      "MySQL connected successfully to:",
      rows[0].databaseName
    );

    return true;
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    return false;
  } finally {
    connection?.release();
  }
}