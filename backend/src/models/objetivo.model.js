import pool from "../config/database.js";

export async function crearObjetivo(usuarioId, datos) {
  const estado = Number(datos.monto_actual) >= Number(datos.monto_objetivo)
    ? "completado"
    : "activo";

  const [resultado] = await pool.execute(
    `INSERT INTO objetivos_financieros
      (usuario_id, nombre, monto_objetivo, monto_actual, fecha_limite, estado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuarioId, datos.nombre, datos.monto_objetivo,
      datos.monto_actual, datos.fecha_limite, estado]
  );

  return buscarObjetivoPorId(resultado.insertId, usuarioId);
}

export async function buscarObjetivoPorId(objetivoId, usuarioId) {
  const [filas] = await pool.execute(
    `SELECT id, nombre, monto_objetivo, monto_actual,
            fecha_limite, estado, created_at
     FROM objetivos_financieros
     WHERE id = ? AND usuario_id = ?
     LIMIT 1`,
    [objetivoId, usuarioId]
  );
  return filas[0] ?? null;
}

export async function consultarObjetivos(usuarioId) {
  const [filas] = await pool.execute(
    `SELECT id, nombre, monto_objetivo, monto_actual,
            fecha_limite, estado, created_at
     FROM objetivos_financieros
     WHERE usuario_id = ? AND estado != 'cancelado'
     ORDER BY
       CASE WHEN estado = 'activo' THEN 0 ELSE 1 END,
       created_at DESC`,
    [usuarioId]
  );
  return filas;
}

export async function registrarAportacion(usuarioId, objetivoId, monto) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [filas] = await connection.execute(
      `SELECT id, monto_objetivo, monto_actual
       FROM objetivos_financieros
       WHERE id = ? AND usuario_id = ? AND estado = 'activo'
       LIMIT 1`,
      [objetivoId, usuarioId]
    );

    if (filas.length === 0) {
      await connection.rollback();
      return null;
    }

    const objetivo = filas[0];
    const montoActual = Number(objetivo.monto_actual) + monto;
    const montoActualLimitado = Math.min(montoActual, Number(objetivo.monto_objetivo));
    const estado = montoActualLimitado >= Number(objetivo.monto_objetivo)
      ? "completado"
      : "activo";

    await connection.execute(
      `INSERT INTO aportaciones_objetivo
        (objetivo_id, usuario_id, monto, fecha)
       VALUES (?, ?, ?, CURDATE())`,
      [objetivoId, usuarioId, monto]
    );

    await connection.execute(
      `UPDATE objetivos_financieros
       SET monto_actual = ?, estado = ?
       WHERE id = ? AND usuario_id = ?`,
      [montoActualLimitado, estado, objetivoId, usuarioId]
    );

    await connection.commit();
    return buscarObjetivoPorId(objetivoId, usuarioId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
