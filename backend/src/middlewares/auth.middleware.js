
import { verificarToken } from "../utils/jwt.js";
import { estaRevocado } from "../services/sesion.service.js";
import pool from "../config/database.js";

export async function autenticarToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      mensaje: "No se proporcionó un token de autenticación",
    });
  }

  const token = authorization.split(" ")[1];

  let datosUsuario;
  try {
    datosUsuario = verificarToken(token);
  } catch (error) {
    return res.status(401).json({
      mensaje: "Token inválido o expirado",
    });
  }

  if (!Number.isInteger(datosUsuario.id) || datosUsuario.id <= 0) {
    return res.status(401).json({
      mensaje: "El token no contiene una identidad de usuario válida",
    });
  }

  // Tokens emitidos antes de este cambio no traen jti: se exige iniciar sesión de nuevo
  if (!datosUsuario.jti) {
    return res.status(401).json({
      mensaje: "Sesión no válida. Inicia sesión nuevamente",
    });
  }

  try {
    if (await estaRevocado(datosUsuario.jti)) {
      return res.status(401).json({
        mensaje: "La sesión ya fue cerrada",
      });
    }
  } catch (error) {
    // Si no se puede comprobar el estado de la sesión, se rechaza la petición
    console.error("Error al verificar el estado de la sesión:", error);
    return res.status(500).json({
      mensaje: "Error interno al verificar la sesión",
    });
  }

  try {
    const [usuarios] = await pool.execute(
      `SELECT activo, token_version, rol
       FROM usuarios
       WHERE id = ?
       LIMIT 1`,
      [datosUsuario.id]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje: "La cuenta ya no existe",
      });
    }

    const usuarioActual = usuarios[0];

    if (!usuarioActual.activo) {
      return res.status(403).json({
        mensaje: "La cuenta se encuentra desactivada",
      });
    }

    if (
      !Number.isInteger(datosUsuario.token_version) ||
      Number(datosUsuario.token_version) !== Number(usuarioActual.token_version)
    ) {
      return res.status(401).json({
        mensaje: "La sesion ya no es valida. Inicia sesion nuevamente",
      });
    }

    req.usuario = {
      ...datosUsuario,
      rol: usuarioActual.rol,
      token_version: usuarioActual.token_version,
    };

    return next();
  } catch (error) {
    console.error("Error al verificar la cuenta y su version:", error);

    return res.status(500).json({
      mensaje: "Error interno al verificar la cuenta",
    });
  }
}