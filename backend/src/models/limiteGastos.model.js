import pool from "../config/database.js";

export async function consultarLimiteGastos(usuarioId) {
  const [filas] = await pool.execute(
    `SELECT monto
     FROM limites_gastos
     WHERE usuario_id = ?
     LIMIT 1`,
    [usuarioId]
  );

  return filas[0] ?? null;
}

export async function guardarLimiteGastos(usuarioId, monto) {
  await pool.execute(
    `INSERT INTO limites_gastos (usuario_id, monto)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE monto = ?`,
    [usuarioId, monto, monto]
  );

  return consultarLimiteGastos(usuarioId);
}
