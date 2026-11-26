import { z } from "zod";
import pool from "../config/database.js";
import {
  guardarPresupuesto,
  consultarPresupuestos,
  consultarNotificaciones,
  eliminarPresupuesto,
} from "../models/presupuesto.model.js";

const presupuestoSchema = z.strictObject({
  categoria_id: z.number().int().positive(),
  mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  monto_limite: z.number().finite().positive().max(9999999999.99)
    .refine(
      (monto) =>
        Math.abs(monto * 100 - Math.round(monto * 100)) < 1e-6,
      "El monto no puede tener más de dos decimales"
    ),
  umbral_medio: z.number().int().min(1).max(99).default(50),
  umbral_alto: z.number().int().min(2).max(100).default(80),
}).refine(
  (datos) => datos.umbral_alto > datos.umbral_medio,
  { message: "El umbral alto debe ser mayor que el umbral medio", path: ["umbral_alto"] }
);

export async function guardarMeta(req, res) {
  const resultado = presupuestoSchema.safeParse(req.body ?? {});

  if (!resultado.success) {
    return res.status(400).json({
      mensaje: "Datos de presupuesto inválidos",
      errores: resultado.error.issues.map((error) => ({
        campo: error.path.join("."),
        mensaje: error.message,
      })),
    });
  }

  const datos = resultado.data;
  const usuarioId = req.usuario.id;

  try {
    const [categorias] = await pool.execute(
      `SELECT id FROM categorias_generales
       WHERE id = ? AND tipo = 'gasto'
         AND (usuario_id IS NULL OR usuario_id = ?)`,
      [datos.categoria_id, usuarioId]
    );

    if (categorias.length === 0) {
      return res.status(400).json({
        mensaje: "La categoría seleccionada no existe o no es de gasto",
      });
    }

    await guardarPresupuesto(usuarioId, datos);
    return res.status(200).json({
      mensaje: "Presupuesto guardado correctamente",
    });
  } catch (error) {
    console.error("Error al guardar presupuesto:", error);
    return res.status(500).json({
      mensaje: "Error interno al guardar el presupuesto",
    });
  }
}

export async function listarMetas(req, res) {
  const mes = req.query.mes;

  if (typeof mes !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    return res.status(400).json({ mensaje: "El mes debe tener formato YYYY-MM" });
  }

  try {
    const presupuestos = await consultarPresupuestos(req.usuario.id, mes);
    return res.status(200).json({ presupuestos });
  } catch (error) {
    console.error("Error al consultar presupuestos:", error);
    return res.status(500).json({
      mensaje: "Error interno al consultar los presupuestos",
    });
  }
}

export async function listarNotificaciones(req, res) {
  try {
    const notificaciones = await consultarNotificaciones(req.usuario.id);
    return res.status(200).json({ notificaciones });
  } catch (error) {
    console.error("Error al consultar notificaciones:", error);
    return res.status(500).json({
      mensaje: "Error interno al consultar las notificaciones",
    });
  }
}

export async function eliminarPresupuestoController(req, res) {
  const usuarioId = req.usuario?.id;
  const id = Number(req.params.id);

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(401).json({ mensaje: "Usuario autenticado no válido" });
  }

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: "El ID del presupuesto no es válido" });
  }

  try {
    const eliminado = await eliminarPresupuesto(id, usuarioId);
    if (!eliminado) {
      return res.status(404).json({ mensaje: "El presupuesto no existe" });
    }

    return res.status(200).json({
      mensaje: "Presupuesto eliminado correctamente",
      id,
    });
  } catch (error) {
    console.error("Error al eliminar presupuesto:", error);
    return res.status(500).json({
      mensaje: "Error interno al eliminar el presupuesto",
    });
  }
}
