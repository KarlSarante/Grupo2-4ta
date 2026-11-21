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
  const parametros = [usuarioId];
  let filtroTipo = "";

  if (tipo !== null) {
    filtroTipo = " AND t.tipo = ?";
    parametros.push(tipo);
  }

  const [transacciones] = await pool.execute(
    `SELECT
       t.id,
       t.usuario_id,
       t.categoria_id,
       c.nombre AS categoria,
       c.nombre AS categoria_nombre,
       t.tipo,
       t.monto,
       DATE_FORMAT(t.fecha, '%Y-%m-%d') AS fecha,
       t.descripcion,
       t.created_at
     FROM transacciones AS t
     LEFT JOIN categorias_generales AS c
       ON c.id = t.categoria_id
     WHERE t.usuario_id = ?${filtroTipo}
     ORDER BY t.fecha DESC, t.created_at DESC, t.id DESC`,
    parametros
  );

  return transacciones;
}

// Compatibilidad con el controlador de ingresos HU004.
export async function consultarTransaccionesPorUsuario(
  usuarioId,
  tipo = null
) {
  return consultarTransacciones(usuarioId, tipo);
}
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

export async function buscarTransaccionPorIdGlobal(id) {
  const [transacciones] = await pool.execute(
    `SELECT id, usuario_id, categoria_id, tipo,
            monto, fecha, descripcion, created_at
     FROM transacciones
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return transacciones[0] ?? null;
}

export async function actualizarTransaccion({
  id,
  usuarioId,
  categoriaId,
  monto,
  fecha,
  descripcion,
}) {
  const [resultado] = await pool.execute(
    `UPDATE transacciones
     SET categoria_id = ?, monto = ?, fecha = ?, descripcion = ?
     WHERE id = ? AND usuario_id = ?`,
    [categoriaId, monto, fecha, descripcion, id, usuarioId]
  );

  if (resultado.affectedRows !== 1) {
    return null;
  }

  return buscarTransaccionPorId(id, usuarioId);
}

export function puedeEditarTransaccion(transaccion, usuarioId) {
  return Boolean(
    transaccion &&
    Number.isInteger(usuarioId) &&
    Number(transaccion.usuario_id) === usuarioId
  );
}

export async function eliminarTransaccion(id, usuarioId) {
  const [resultado] = await pool.execute(
    `DELETE FROM transacciones
     WHERE id = ? AND usuario_id = ?`,
    [id, usuarioId]
  );

  return resultado.affectedRows === 1;
}
