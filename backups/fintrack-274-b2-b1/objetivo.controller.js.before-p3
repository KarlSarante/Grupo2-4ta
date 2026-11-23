import { z } from "zod";
import {
  crearObjetivo,
  consultarObjetivos,
  registrarAportacion,
} from "../models/objetivo.model.js";

const objetivoSchema = z.strictObject({
  nombre: z.string().trim().min(2).max(100),
  monto_objetivo: z.number().finite().positive().max(9999999999.99)
    .refine(
      (monto) =>
        Math.abs(monto * 100 - Math.round(monto * 100)) < 1e-6,
      "El monto no puede tener más de dos decimales"
    ),
  monto_actual: z.number().finite().min(0).max(9999999999.99)
    .refine(
      (monto) =>
        Math.abs(monto * 100 - Math.round(monto * 100)) < 1e-6,
      "El monto no puede tener más de dos decimales"
    )
    .default(0),
  fecha_limite: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((valor) => {
      const [anio, mes, dia] = valor.split("-").map(Number);

      if (anio < 1 || mes < 1 || mes > 12 || dia < 1) {
        return false;
      }

      const fecha = new Date(0);
      fecha.setUTCHours(0, 0, 0, 0);
      fecha.setUTCFullYear(anio, mes - 1, dia);

      return fecha.getUTCFullYear() === anio
        && fecha.getUTCMonth() === mes - 1
        && fecha.getUTCDate() === dia;
    }, "La fecha límite no es una fecha válida")
    .nullable()
    .optional(),
}).refine(
  (datos) => datos.monto_actual <= datos.monto_objetivo,
  { message: "El monto inicial no puede superar el objetivo", path: ["monto_actual"] }
);

const aportacionSchema = z.strictObject({
  monto: z.number().finite().positive().max(9999999999.99)
    .refine(
      (monto) =>
        Math.abs(monto * 100 - Math.round(monto * 100)) < 1e-6,
      "El monto no puede tener más de dos decimales"
    ),
});

function traducirErrores(issues) {
  const nombres = {
    nombre: "El nombre de la meta",
    monto_objetivo: "El monto objetivo",
    monto_actual: "El monto acumulado",
    fecha_limite: "La fecha límite",
    monto: "El monto de la aportación",
  };

  return issues.flatMap((error) => {
    if (error.code === "unrecognized_keys") {
      return error.keys.map((campo) => ({
        campo,
        mensaje: `El campo «${campo}» no está permitido en esta operación.`,
      }));
    }

    const campo = error.path.join(".");
    const nombre = nombres[campo] || "El valor indicado";
    let mensaje = error.message;

    if (error.code === "invalid_type") {
      if (error.input === undefined) {
        mensaje = `${nombre} es obligatorio.`;
      } else if (campo === "fecha_limite") {
        mensaje = "Ingresa una fecha válida con el formato AAAA-MM-DD.";
      } else {
        mensaje = `${nombre} debe tener un tipo de dato válido.`;
      }
    } else if (error.code === "too_small") {
      if (campo === "nombre") {
        mensaje = "El nombre debe tener al menos 2 caracteres.";
      } else if (campo === "monto_actual") {
        mensaje = "El monto acumulado no puede ser negativo.";
      } else {
        mensaje = `${nombre} debe ser mayor que cero.`;
      }
    } else if (error.code === "too_big") {
      mensaje = campo === "nombre"
        ? "El nombre no puede superar los 100 caracteres."
        : `${nombre} supera el monto máximo permitido.`;
    } else if (error.code === "invalid_format" && campo === "fecha_limite") {
      mensaje = "Ingresa una fecha válida con el formato AAAA-MM-DD.";
    }

    return [{ campo, mensaje }];
  });
}
export async function crearMetaFinanciera(req, res) {
  const resultado = objetivoSchema.safeParse(req.body ?? {});

  if (!resultado.success) {
    return res.status(400).json({
      mensaje: "Revisa los datos de la meta financiera.",
      errores: traducirErrores(resultado.error.issues),
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
      mensaje: "Revisa los datos de la aportación.",
      errores: traducirErrores(resultado.error.issues),
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
        mensaje: "La meta financiera no existe",
      });
    }

    return res.status(200).json({
      mensaje: "Aportación registrada correctamente",
      objetivo,
    });
  } catch (error) {
    if (error.code === "OBJETIVO_YA_COMPLETADO") {
      return res.status(409).json({
        mensaje: "La meta financiera ya fue completada",
      });
    }

    if (error.code === "OBJETIVO_NO_ACTIVO") {
      return res.status(409).json({
        mensaje: "La meta financiera no admite nuevas aportaciones",
      });
    }

    if (error.code === "OBJETIVO_MONTO_MAXIMO_EXCEDIDO") {
      return res.status(409).json({
        mensaje: "La aportación supera el saldo máximo permitido para la meta financiera",
      });
    }

    console.error("Error al registrar aportación:", error);
    return res.status(500).json({
      mensaje: "Error interno al registrar la aportación",
    });
  }
}
