// services/sesion.service.js
import pool from "../config/database.js";

// Invalida un token. "exp" viene del propio JWT (segundos desde 1970).
export async function revocarToken({ jti, id, exp }) {
  await pool.execute(
    `INSERT IGNORE INTO tokens_revocados (jti, usuario_id, expira_en)
     VALUES (?, ?, FROM_UNIXTIME(?))`,
    [jti, id, exp]
  );
}

export async function estaRevocado(jti) {
  const [filas] = await pool.execute(
    `SELECT 1 FROM tokens_revocados WHERE jti = ? LIMIT 1`,
    [jti]
  );
  return filas.length > 0;
}

// Un token vencido ya se rechaza por expiración, así que su registro sobra.
export async function limpiarTokensExpirados() {
  await pool.execute(`DELETE FROM tokens_revocados WHERE expira_en < NOW()`);
}