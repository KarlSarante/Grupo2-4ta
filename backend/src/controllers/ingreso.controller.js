import { z } from "zod";
import pool from "../config/database.js";
import { crearTransaccion } from "../models/transaccion.model.js";

// Comprobar que la fecha exista realmente en el calendario.
function esFechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const [anio, mes, dia] = fecha.split("-").map(Number);

  if (anio < 1000 || anio > 9999) {
    return false;
  }

  const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fechaUTC.getUTCFullYear() === anio &&
    fechaUTC.getUTCMonth() === mes - 1 &&
    fechaUTC.getUTCDate() === dia
  );
}

// HU004 / #62: Esquema de validación para registrar ingresos.
const ingresoSchema = z.strictObject({
  categoria_id: z.number({
    error: "El ID de la categoría debe ser un número",
  })
    .int("El ID de la categoría debe ser un entero")
    .positive("El ID de la categoría debe ser positivo")
    .safe("El ID de la categoría está fuera del rango permitido"),

  monto: z.number({
    error: "El monto debe ser un número",
  })
    .finite("El monto debe ser finito")
    .positive("El monto debe ser mayor que cero")
    .max(9999999999.99, "El monto supera el máximo permitido")
    .refine(
      (monto) =>
        Math.abs(monto * 100 - Math.round(monto * 100)) < 1e-6,
      "El monto no puede tener más de dos decimales"
    ),

  fecha: z.string({
    error: "La fecha debe ser un texto",
  }).refine(
    esFechaValida,
    "La fecha debe ser válida y tener formato YYYY-MM-DD"
  ),

  descripcion: z.string({
    error: "La descripción debe ser un texto",
  })
    .max(255, "La descripción no puede superar los 255 caracteres")
    .nullable()
    .optional(),
});

// Convertir los errores de Zod al formato utilizado por la API.
function formatearErrores(issues) {
  return issues.map((error) => {
    if (error.code === "unrecognized_keys") {
      const campos = error.keys.join(", ");

      return {
        campo: campos,
        mensaje: `Se enviaron campos no permitidos: ${campos}`,
      };
    }

    return {
      campo: error.path.join("."),
      mensaje: error.message,
    };
  });
}

// HU004: Registrar un ingreso del usuario autenticado.
export async function registrarIngreso(req, res) {
  // Validar los datos recibidos antes de consultar MySQL.
  const resultado = ingresoSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      mensaje: "Datos de ingreso inválidos",
      errores: formatearErrores(resultado.error.issues),
    });
  }

  const {
    categoria_id,
    monto,
    fecha,
    descripcion,
  } = resultado.data;

  // Obtener el usuario del JWT, nunca del cuerpo de la solicitud.
  const usuarioId = req.usuario.id;

  try {
    // Comprobar que la categoría exista y sea de tipo ingreso.
    const [categorias] = await pool.execute(
      `SELECT id
       FROM categorias_generales
       WHERE id = ? AND tipo = 'ingreso'
       LIMIT 1`,
      [categoria_id]
    );

    if (categorias.length === 0) {
      return res.status(400).json({
        mensaje: "La categoría seleccionada no existe o no es de ingreso",
      });
    }

    // Registrar el ingreso mediante el modelo compartido.
    const ingreso = await crearTransaccion({
      usuarioId,
      categoriaId: categoria_id,
      tipo: "ingreso",
      monto,
      fecha,
      descripcion: descripcion ?? null,
    });

    return res.status(201).json({
      mensaje: "Ingreso registrado correctamente",
      ingreso,
    });
  } catch (error) {
    console.error("Error al registrar ingreso:", error);

    return res.status(500).json({
      mensaje: "Error interno al registrar el ingreso",
    });
  }
}
