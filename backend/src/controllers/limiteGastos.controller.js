import {
  consultarLimiteGastos,
  guardarLimiteGastos,
} from "../models/limiteGastos.model.js";

function usuarioValido(req) {
  return (
    Number.isInteger(req.usuario?.id) &&
    req.usuario.id > 0
  );
}

function validarMonto(monto) {
  if (monto === undefined || monto === null || monto === "") {
    return { error: "Debes ingresar un monto" };
  }

  if (typeof monto !== "number" && typeof monto !== "string") {
    return { error: "El monto debe ser un número válido" };
  }

  const texto = String(monto);

  if (!/^-?\d+(\.\d+)?$/.test(texto)) {
    return { error: "El monto debe ser un número válido" };
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero)) {
    return { error: "El monto supera el máximo permitido" };
  }

  if (numero <= 0) {
    return { error: "El monto debe ser mayor que cero" };
  }

  if (numero > 9999999999.99) {
    return { error: "El monto supera el máximo permitido" };
  }

  const partes = texto.split(".");

  if (partes.length === 2 && partes[1].length > 2) {
    return {
      error: "El monto solo puede tener hasta dos decimales",
    };
  }

  return { monto: numero.toFixed(2) };
}

export async function obtenerLimiteGastos(req, res) {
  try {
    if (!usuarioValido(req)) {
      return res.status(401).json({
        mensaje: "Usuario autenticado no válido",
      });
    }

    const limite = await consultarLimiteGastos(
      req.usuario.id
    );

    return res.status(200).json({ limite });
  } catch (error) {
    console.error("Error al consultar límite:", error);

    return res.status(500).json({
      mensaje: "Error interno al consultar el límite",
    });
  }
}

export async function actualizarLimiteGastos(req, res) {
  try {
    if (!usuarioValido(req)) {
      return res.status(401).json({
        mensaje: "Usuario autenticado no válido",
      });
    }

    const resultado = validarMonto(req.body?.monto);

    if (resultado.error) {
      return res.status(400).json({
        mensaje: resultado.error,
      });
    }

    const limite = await guardarLimiteGastos(
      req.usuario.id,
      resultado.monto
    );

    return res.status(200).json({
      mensaje: "Límite actualizado correctamente",
      limite,
    });
  } catch (error) {
    console.error("Error al actualizar límite:", error);

    return res.status(500).json({
      mensaje: "Error interno al actualizar el límite",
    });
  }
}
