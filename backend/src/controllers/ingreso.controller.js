import pool from "../config/database.js";
import { crearTransaccion } from "../models/transaccion.model.js";

// HU004: Registrar un ingreso del usuario autenticado.
export async function registrarIngreso(req, res) {
  // El usuario se obtiene del JWT, nunca del cuerpo de la solicitud.
  const usuarioId = req.usuario.id;
  const { categoria_id, monto, fecha, descripcion } = req.body ?? {};

  // Comprobar que se proporcionaron los datos obligatorios.
  if (
    categoria_id === undefined ||
    monto === undefined ||
    fecha === undefined
  ) {
    return res.status(400).json({
      mensaje: "La categoría, el monto y la fecha son obligatorios",
    });
  }

  // Validar los tipos básicos y el rango del monto.
  if (
    !Number.isSafeInteger(categoria_id) ||
    categoria_id <= 0 ||
    typeof monto !== "number" ||
    !Number.isFinite(monto) ||
    monto <= 0 ||
    monto > 9999999999.99 ||
    !Number.isInteger(monto * 100)
  ) {
    return res.status(400).json({
      mensaje: "La categoría o el monto no son válidos",
    });
  }

  // Comprobar que la fecha tenga formato YYYY-MM-DD y sea real.
  const fechaValida =
    typeof fecha === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
    !Number.isNaN(Date.parse(`${fecha}T00:00:00Z`)) &&
    new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) === fecha;

  if (!fechaValida) {
    return res.status(400).json({
      mensaje: "La fecha debe ser una fecha válida en formato YYYY-MM-DD",
    });
  }

  // La descripción es opcional, pero debe respetar el esquema MySQL.
  if (
    descripcion !== undefined &&
    descripcion !== null &&
    (typeof descripcion !== "string" || descripcion.length > 255)
  ) {
    return res.status(400).json({
      mensaje: "La descripción debe ser un texto de hasta 255 caracteres",
    });
  }

  try {
    // Verificar que la categoría exista y corresponda a ingresos.
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
