import pool from "../config/database.js";

// Crear una transacción de ingreso o gasto asociada a un usuario.
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

// Consultar las transacciones pertenecientes a un usuario.
// Permite filtrar opcionalmente por ingreso o gasto.
export async function consultarTransaccionesPorUsuario(
  usuarioId,
  tipo = null
) {
  if (tipo !== null) {
    const [transacciones] = await pool.execute(
      `SELECT id, usuario_id, categoria_id, tipo,
              monto, fecha, descripcion, created_at
       FROM transacciones
       WHERE usuario_id = ? AND tipo = ?
       ORDER BY fecha DESC, id DESC`,
      [usuarioId, tipo]
    );

    return transacciones;
  }

  const [transacciones] = await pool.execute(
    `SELECT id, usuario_id, categoria_id, tipo,
            monto, fecha, descripcion, created_at
     FROM transacciones
     WHERE usuario_id = ?
     ORDER BY fecha DESC, id DESC`,
    [usuarioId]
  );

  return transacciones;
}

// Buscar una transacción por su ID, verificando que pertenezca al usuario.
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
