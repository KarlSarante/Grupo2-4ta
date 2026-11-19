import { consultarTransacciones } from "../models/transaccion.model.js";

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
