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
  let commitIntentado = false;
  let rollbackIntentado = false;

  try {
    await connection.beginTransaction();

    const [filas] = await connection.execute(
      `SELECT id, monto_objetivo, monto_actual, estado
       FROM objetivos_financieros
       WHERE id = ? AND usuario_id = ?
       LIMIT 1 FOR UPDATE`,
      [objetivoId, usuarioId]
    );

    if (filas.length === 0) {
      rollbackIntentado = true;
      await connection.rollback();
      return null;
    }

    const objetivo = filas[0];

    if (objetivo.estado !== "activo") {
      const error = new Error(
        objetivo.estado === "completado"
          ? "La meta financiera ya fue completada"
          : "La meta financiera no admite nuevas aportaciones"
      );

      error.code = objetivo.estado === "completado"
        ? "OBJETIVO_YA_COMPLETADO"
        : "OBJETIVO_NO_ACTIVO";

      throw error;
    }

    const saldoCentavos = Math.round(Number(objetivo.monto_actual) * 100);
    const aporteCentavos = Math.round(monto * 100);
    const maximoCentavos = 999999999999;

    if (saldoCentavos + aporteCentavos > maximoCentavos) {
      const error = new Error(
        "La aportación supera el saldo máximo permitido para la meta financiera"
      );
      error.code = "OBJETIVO_MONTO_MAXIMO_EXCEDIDO";
      throw error;
    }

    const montoActual = (saldoCentavos + aporteCentavos) / 100;
    const montoActualLimitado = montoActual;
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

    // Recuperar el resultado dentro de la transaccion.
    const [filasActualizadas] = await connection.execute(
      `SELECT id, nombre, monto_objetivo, monto_actual,
              fecha_limite, estado, created_at
       FROM objetivos_financieros
       WHERE id = ? AND usuario_id = ?
       LIMIT 1`,
      [objetivoId, usuarioId]
    );

    if (filasActualizadas.length !== 1) {
      throw new Error("No se pudo recuperar la meta actualizada");
    }

    // El resultado de COMMIT puede ser incierto si falla.
    commitIntentado = true;
    await connection.commit();

    return filasActualizadas[0];
  } catch (error) {
    if (!commitIntentado && !rollbackIntentado) {
      rollbackIntentado = true;
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error al revertir la aportacion:", rollbackError);
      }
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function actualizarObjetivo(usuarioId, objetivoId, datos) {
  const connection = await pool.getConnection();
  let commitIntentado = false;
  let rollbackIntentado = false;

  try {
    await connection.beginTransaction();

    const [filas] = await connection.execute(
      `SELECT id, monto_actual, estado
       FROM objetivos_financieros
       WHERE id = ? AND usuario_id = ?
       LIMIT 1 FOR UPDATE`,
      [objetivoId, usuarioId]
    );

    if (filas.length === 0) {
      rollbackIntentado = true;
      await connection.rollback();
      return null;
    }

    const meta = filas[0];

    if (meta.estado === "cancelado") {
      const error = new Error(
        "La meta financiera cancelada no puede editarse"
      );
      error.code = "OBJETIVO_CANCELADO";
      throw error;
    }

    if (meta.estado !== "activo" && meta.estado !== "completado") {
      const error = new Error(
        "La meta financiera tiene un estado no permitido"
      );
      error.code = "OBJETIVO_ESTADO_INVALIDO";
      throw error;
    }

    const acumuladoCentavos = Math.round(
      Number(meta.monto_actual) * 100
    );
    const objetivoCentavos = Math.round(
      Number(datos.monto_objetivo) * 100
    );

    const estado = acumuladoCentavos >= objetivoCentavos
      ? "completado"
      : "activo";

    await connection.execute(
      `UPDATE objetivos_financieros
       SET nombre = ?, monto_objetivo = ?,
           fecha_limite = ?, estado = ?
       WHERE id = ? AND usuario_id = ?`,
      [
        datos.nombre,
        datos.monto_objetivo,
        datos.fecha_limite,
        estado,
        objetivoId,
        usuarioId
      ]
    );

    const [actualizadas] = await connection.execute(
      `SELECT id, nombre, monto_objetivo, monto_actual,
              fecha_limite, estado, created_at
       FROM objetivos_financieros
       WHERE id = ? AND usuario_id = ?
       LIMIT 1`,
      [objetivoId, usuarioId]
    );

    if (actualizadas.length !== 1) {
      throw new Error("No se pudo recuperar la meta actualizada");
    }

    commitIntentado = true;
    await connection.commit();

    return actualizadas[0];
  } catch (error) {
    if (!commitIntentado && !rollbackIntentado) {
      rollbackIntentado = true;
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Error al revertir la edicion de meta:",
          rollbackError
        );
      }
    }

    throw error;
  } finally {
    connection.release();
  }
}