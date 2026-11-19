import pool from "../config/database.js";

// Crear una transacción asociada al usuario autenticado.
export async function crearTransaccion({
  usuarioId,
  categoriaId,
  tipo,
  monto,
  fecha,
  descripcion = null,
}) {
  const [resultado] = await pool.execute(
    `INSERT INTO transacciones
      (usuario_id, categoria_id, tipo, monto, fecha, descripcion)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuarioId, categoriaId, tipo, monto, fecha, descripcion]
  );

  return {
    id: resultado.insertId,
    usuario_id: usuarioId,
    categoria_id: categoriaId,
    tipo,
    monto,
    fecha,
    descripcion,
  };
}

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

// Buscar una transacción verificando que pertenezca al usuario.
export async function buscarTransaccionPorId(id, usuarioId) {
  const [transacciones] = await pool.execute(
    `SELECT id, usuario_id, categoria_id, tipo,
            monto, fecha, descripcion, created_at
     FROM transacciones
     WHERE id = ? AND usuario_id = ?
     LIMIT 1`,
    [id, usuarioId]
  );

  return transacciones[0] ?? null;
}
