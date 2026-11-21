import { z } from "zod";
import pool from "../config/database.js";
import {
  consultarTransacciones,
  buscarTransaccionPorId,
  actualizarTransaccion,
  puedeEditarTransaccion,
  eliminarTransaccion,
} from "../models/transaccion.model.js";
import { evaluarPresupuesto } from "../services/presupuesto.service.js";

function esFechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;

  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (anio < 1000 || anio > 9999) return false;

  const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fechaUTC.getUTCFullYear() === anio &&
    fechaUTC.getUTCMonth() === mes - 1 &&
    fechaUTC.getUTCDate() === dia
  );
}

const editarTransaccionSchema = z.strictObject({
  categoria_id: z.number({ error: "El ID de la categoría debe ser un número" })
    .int("El ID de la categoría debe ser un entero")
    .positive("El ID de la categoría debe ser positivo"),
  monto: z.number({ error: "El monto debe ser un número" })
    .finite("El monto debe ser finito")
    .positive("El monto debe ser mayor que cero")
    .max(9999999999.99, "El monto supera el máximo permitido")
    .refine(
      (monto) => Math.abs(monto * 100 - Math.round(monto * 100)) < 1e-6,
      "El monto no puede tener más de dos decimales"
    ),
  fecha: z.string({ error: "La fecha debe ser un texto" })
    .refine(esFechaValida, "La fecha debe ser válida y tener formato YYYY-MM-DD"),
  descripcion: z.string({ error: "La descripción debe ser un texto" })
    .max(255, "La descripción no puede superar los 255 caracteres")
    .nullable()
    .optional(),
});

export function validarDatosEdicionTransaccion(datos) {
  return editarTransaccionSchema.safeParse(datos ?? {});
}

function formatearErrores(issues) {
  return issues.map((error) => ({
    campo: error.path.join("."),
    mensaje: error.message,
  }));
}

export async function obtenerTransacciones(req, res) {
  try {
    if (!Number.isInteger(req.usuario?.id) || req.usuario.id <= 0) {
      return res.status(401).json({
        mensaje: "Usuario autenticado no válido",
      });
    }

    const tipo = req.query.tipo ?? null;

    if (tipo !== null && !["ingreso", "gasto"].includes(tipo)) {
      return res.status(400).json({
        mensaje: "El tipo debe ser ingreso o gasto",
      });
    }

    const transacciones = await consultarTransacciones(req.usuario.id, tipo);

    return res.status(200).json({
      transacciones,
    });
  } catch (error) {
    console.error("Error al consultar transacciones:", error);

    return res.status(500).json({
      mensaje: "Error interno al consultar transacciones",
    });
  }
}

export async function obtenerIngresos(req, res) {
  try {
    const ingresos = await consultarTransacciones(req.usuario.id, "ingreso");

    return res.status(200).json({
      transacciones: ingresos,
    });
  } catch (error) {
    console.error("Error al consultar ingresos:", error);

    return res.status(500).json({
      mensaje: "Error interno al consultar ingresos",
    });
  }
}

export async function obtenerGastos(req, res) {
  try {
    const gastos = await consultarTransacciones(req.usuario.id, "gasto");

    return res.status(200).json({
      transacciones: gastos,
    });
  } catch (error) {
    console.error("Error al consultar gastos:", error);

    return res.status(500).json({
      mensaje: "Error interno al consultar gastos",
    });
  }
}

export async function editarTransaccion(req, res) {
  const usuarioId = req.usuario?.id;
  const id = Number(req.params.id);

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(401).json({ mensaje: "Usuario autenticado no válido" });
  }

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: "El ID de la transacción no es válido" });
  }

  const resultado = validarDatosEdicionTransaccion(req.body);
  if (!resultado.success) {
    return res.status(400).json({
      mensaje: "Datos de transacción inválidos",
      errores: formatearErrores(resultado.error.issues),
    });
  }

  try {
    const transaccion = await buscarTransaccionPorId(id, usuarioId);
    if (!puedeEditarTransaccion(transaccion, usuarioId)) {
      return res.status(404).json({ mensaje: "La transacción no existe" });
    }

    const { categoria_id, monto, fecha, descripcion } = resultado.data;
    const [categorias] = await pool.execute(
      `SELECT id
       FROM categorias_generales
       WHERE id = ? AND tipo = ?
         AND (usuario_id IS NULL OR usuario_id = ?)
       LIMIT 1`,
      [categoria_id, transaccion.tipo, usuarioId]
    );

    if (categorias.length === 0) {
      return res.status(400).json({
        mensaje: `La categoría seleccionada no existe o no es de ${transaccion.tipo}`,
      });
    }

    const actualizada = await actualizarTransaccion({
      id,
      usuarioId,
      categoriaId: categoria_id,
      monto,
      fecha,
      descripcion: descripcion?.trim() || null,
    });

    if (!actualizada) {
      return res.status(404).json({ mensaje: "La transacción no existe" });
    }

    let advertencia = null;
    if (transaccion.tipo === "gasto") {
      try {
        const fechaAnterior = transaccion.fecha instanceof Date
          ? transaccion.fecha.toISOString().slice(0, 10)
          : String(transaccion.fecha).slice(0, 10);
        await evaluarPresupuesto(usuarioId, transaccion.categoria_id, fechaAnterior);
        await evaluarPresupuesto(usuarioId, categoria_id, fecha);
      } catch (error) {
        advertencia = "La transacción se actualizó, pero no fue posible actualizar las alertas del presupuesto.";
        console.error("Error al evaluar alertas del presupuesto:", error);
      }
    }

    return res.status(200).json({
      mensaje: "Transacción actualizada correctamente",
      transaccion: actualizada,
      ...(advertencia ? { advertencia } : {}),
    });
  } catch (error) {
    console.error("Error al editar transacción:", error);
    return res.status(500).json({
      mensaje: "Error interno al editar la transacción",
    });
  }
}

export async function eliminarTransaccionController(req, res) {
  const usuarioId = req.usuario?.id;
  const id = Number(req.params.id);

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(401).json({ mensaje: "Usuario autenticado no válido" });
  }

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: "El ID de la transacción no es válido" });
  }

  try {
    const transaccion = await buscarTransaccionPorId(id, usuarioId);
    if (!puedeEditarTransaccion(transaccion, usuarioId)) {
      return res.status(404).json({ mensaje: "La transacción no existe" });
    }

    const eliminada = await eliminarTransaccion(id, usuarioId);
    if (!eliminada) {
      return res.status(404).json({ mensaje: "La transacción no existe" });
    }

    let advertencia = null;
    if (transaccion.tipo === "gasto") {
      try {
        const fecha = transaccion.fecha instanceof Date
          ? transaccion.fecha.toISOString().slice(0, 10)
          : String(transaccion.fecha).slice(0, 10);
        await evaluarPresupuesto(usuarioId, transaccion.categoria_id, fecha);
      } catch (error) {
        advertencia = "La transacción se eliminó, pero no fue posible actualizar las alertas del presupuesto.";
        console.error("Error al actualizar alertas del presupuesto:", error);
      }
    }

    return res.status(200).json({
      mensaje: "Transacción eliminada correctamente",
      id,
      ...(advertencia ? { advertencia } : {}),
    });
  } catch (error) {
    console.error("Error al eliminar transacción:", error);
    return res.status(500).json({
      mensaje: "Error interno al eliminar la transacción",
    });
  }
}
