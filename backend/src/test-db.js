
import pool from "./config/database.js";

async function testConnection() {
  try {
    const [rows] = await pool.query(
      "SELECT DATABASE() AS base_datos, VERSION() AS version"
    );

    console.log("Conexión a MySQL exitosa");
    console.log("Base de datos:", rows[0].base_datos);
    console.log("Versión de MySQL:", rows[0].version);
  } catch (error) {
    console.error("Error al conectar con MySQL:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testConnection();
