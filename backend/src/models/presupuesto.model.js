import pool from "../config/database.js";

export async function guardarPresupuesto(usuarioId, datos) {
  await pool.execute(
    `INSERT INTO presupuestos_mensuales
      (usuario_id, categoria_id, mes, monto_limite, umbral_medio, umbral_alto)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      monto_limite = VALUES(monto_limite),
      umbral_medio = VALUES(umbral_medio),
      umbral_alto = VALUES(umbral_alto)`,
    [usuarioId, datos.categoria_id, datos.mes,
      datos.monto_limite, datos.umbral_medio, datos.umbral_alto]
  );
}

export async function consultarPresupuestos(usuarioId, mes) {
  const [filas] = await pool.execute(
    `SELECT p.id, p.categoria_id, c.nombre AS categoria,
            p.mes, p.monto_limite, p.umbral_medio, p.umbral_alto,
            COALESCE((
              SELECT SUM(t.monto)
              FROM transacciones t
              WHERE t.usuario_id = p.usuario_id
                AND t.categoria_id = p.categoria_id
                AND t.tipo = 'gasto'
                AND DATE_FORMAT(t.fecha, '%Y-%m') = p.mes
            ), 0) AS gastado
     FROM presupuestos_mensuales p
     JOIN categorias_generales c ON c.id = p.categoria_id
     WHERE p.usuario_id = ? AND p.mes = ?
     ORDER BY c.nombre ASC`,
    [usuarioId, mes]
  );
  return filas;
}

export async function consultarNotificaciones(usuarioId) {
  const [filas] = await pool.execute(
    `SELECT n.id, n.nivel, n.gastado, n.monto_limite, n.mes,
            n.created_at, c.nombre AS categoria
     FROM notificaciones_presupuesto n
     JOIN presupuestos_mensuales p ON p.id = n.presupuesto_id
     JOIN categorias_generales c ON c.id = p.categoria_id
     WHERE n.usuario_id = ?
     ORDER BY n.created_at DESC
     LIMIT 20`,
    [usuarioId]
  );
  return filas;
}
