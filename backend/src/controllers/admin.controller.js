import pool from "../config/database.js";

export async function consultarUsuarios(req, res) {
  try {
    const [usuarios] = await pool.execute(
      `SELECT id, nombre, email, rol, activo
       FROM usuarios
       ORDER BY id ASC`
    );

    return res.status(200).json({
      usuarios,
    });
  } catch (error) {
    console.error("Error al consultar usuarios:", error);

    return res.status(500).json({
      mensaje: "Error interno al consultar usuarios",
    });
  }
}
