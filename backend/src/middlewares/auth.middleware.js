
import { verificarToken } from "../utils/jwt.js";
import { estaRevocado } from "../services/sesion.service.js";

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

  req.usuario = datosUsuario;
  next();
}