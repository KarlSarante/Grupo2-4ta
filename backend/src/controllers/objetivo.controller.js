import { z } from "zod";
import {
  crearObjetivo,
  consultarObjetivos,
  registrarAportacion,
} from "../models/objetivo.model.js";

const objetivoSchema = z.strictObject({
  nombre: z.string().trim().min(2).max(100),
  monto_objetivo: z.number().finite().positive().max(9999999999.99),
  monto_actual: z.number().finite().min(0).max(9999999999.99).default(0),
  fecha_limite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).refine(
  (datos) => datos.monto_actual <= datos.monto_objetivo,
  { message: "El monto inicial no puede superar el objetivo", path: ["monto_actual"] }
);

const aportacionSchema = z.strictObject({
  monto: z.number().finite().positive().max(9999999999.99),
});

export async function crearMetaFinanciera(req, res) {
  const resultado = objetivoSchema.safeParse(req.body ?? {});

  if (!resultado.success) {
    return res.status(400).json({
      mensaje: "Datos de objetivo inválidos",
      errores: resultado.error.issues.map((error) => ({
        campo: error.path.join("."),
        mensaje: error.message,
      })),
    });
  }

  try {
    const objetivo = await crearObjetivo(req.usuario.id, {
      ...resultado.data,
      fecha_limite: resultado.data.fecha_limite || null,
    });

    return res.status(201).json({
      mensaje: "Meta financiera creada correctamente",
      objetivo,
    });
  } catch (error) {
    console.error("Error al crear objetivo:", error);
    return res.status(500).json({
      mensaje: "Error interno al crear la meta financiera",
    });
  }
}

export async function listarMetasFinancieras(req, res) {
  try {
    const objetivos = await consultarObjetivos(req.usuario.id);
    return res.status(200).json({ objetivos });
  } catch (error) {
    console.error("Error al consultar objetivos:", error);
    return res.status(500).json({
      mensaje: "Error interno al consultar las metas financieras",
    });
  }
}

export async function agregarAportacion(req, res) {
  const resultado = aportacionSchema.safeParse(req.body ?? {});

  if (!resultado.success) {
    return res.status(400).json({
      mensaje: "Monto de aportación inválido",
      errores: resultado.error.issues.map((error) => ({
        campo: error.path.join("."),
        mensaje: error.message,
      })),
    });
  }

  const objetivoId = Number(req.params.id);
  if (!Number.isSafeInteger(objetivoId) || objetivoId <= 0) {
    return res.status(400).json({ mensaje: "Objetivo no válido" });
  }

  try {
    const objetivo = await registrarAportacion(
      req.usuario.id,
      objetivoId,
      resultado.data.monto
    );

    if (!objetivo) {
      return res.status(404).json({
        mensaje: "El objetivo no existe o ya fue completado",
      });
    }

    return res.status(200).json({
      mensaje: "Aportación registrada correctamente",
      objetivo,
    });
  } catch (error) {
    console.error("Error al registrar aportación:", error);
    return res.status(500).json({
      mensaje: "Error interno al registrar la aportación",
    });
  }
}
