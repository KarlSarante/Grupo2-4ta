import pool from "../config/database.js";

// Consultar el historial de un usuario, opcionalmente filtrado por tipo.
export async function consultarTransacciones(usuarioId, tipo = null) {
  if (tipo !== null) {
    const [transacciones] = await pool.execute(
      `SELECT
         t.id,
         t.fecha,
         t.descripcion,
         t.tipo,
         t.monto,
         cg.id AS categoria_id,
         cg.nombre AS categoria
       FROM transacciones t
       INNER JOIN categorias_generales cg
         ON cg.id = t.categoria_id
       WHERE t.usuario_id = ?
         AND t.tipo = ?
       ORDER BY t.fecha DESC, t.created_at DESC, t.id DESC`,
      [usuarioId, tipo]
    );

    return transacciones;
  }

  const [transacciones] = await pool.execute(
    `SELECT
       t.id,
       t.fecha,
       t.descripcion,
       t.tipo,
       t.monto,
       cg.id AS categoria_id,
       cg.nombre AS categoria
     FROM transacciones t
     INNER JOIN categorias_generales cg
       ON cg.id = t.categoria_id
     WHERE t.usuario_id = ?
     ORDER BY t.fecha DESC, t.created_at DESC, t.id DESC`,
    [usuarioId]
  );

  return transacciones;
}
