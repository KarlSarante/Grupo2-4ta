import pool from "../config/database.js";

export async function evaluarPresupuesto(usuarioId, categoriaId, fecha) {
  const mes = fecha.slice(0, 7);
  const [presupuestos] = await pool.execute(
    `SELECT id, monto_limite, umbral_medio, umbral_alto
     FROM presupuestos_mensuales
     WHERE usuario_id = ? AND categoria_id = ? AND mes = ?`,
    [usuarioId, categoriaId, mes]
  );

  if (presupuestos.length === 0) return [];

  const [totales] = await pool.execute(
    `SELECT COALESCE(SUM(monto), 0) AS gastado
     FROM transacciones
     WHERE usuario_id = ? AND categoria_id = ?
       AND tipo = 'gasto' AND DATE_FORMAT(fecha, '%Y-%m') = ?`,
    [usuarioId, categoriaId, mes]
  );

  const presupuesto = presupuestos[0];
  const gastado = Number(totales[0].gastado);
  const limite = Number(presupuesto.monto_limite);
  const porcentaje = limite > 0 ? (gastado / limite) * 100 : 0;
  const alertas = [];

  for (const nivel of [presupuesto.umbral_medio, presupuesto.umbral_alto]) {
    if (porcentaje < nivel) continue;

    try {
      await pool.execute(
        `INSERT INTO notificaciones_presupuesto
          (usuario_id, presupuesto_id, nivel, gastado, monto_limite, mes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [usuarioId, presupuesto.id, nivel, gastado, limite, mes]
      );

      alertas.push({ nivel, gastado, limite, mes });
    } catch (error) {
      if (error.code !== "ER_DUP_ENTRY" || error.errno !== 1062) {
        throw error;
      }

      await pool.execute(
        `UPDATE notificaciones_presupuesto
         SET gastado = ?, monto_limite = ?
         WHERE presupuesto_id = ? AND usuario_id = ?
           AND nivel = ? AND mes = ?`,
        [gastado, limite, presupuesto.id, usuarioId, nivel, mes]
      );
    }
  }

  return alertas;
}
