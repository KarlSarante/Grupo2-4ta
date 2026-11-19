import { consultarTransacciones } from "../models/transaccion.model.js";

export async function obtenerTransacciones(req, res) {
  try {
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
