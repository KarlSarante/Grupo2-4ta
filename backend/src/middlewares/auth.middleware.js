
import { verificarToken } from "../utils/jwt.js";

export function autenticarToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      mensaje: "No se proporcionó un token de autenticación",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const datosUsuario = verificarToken(token);

    req.usuario = datosUsuario;

    next();
  } catch (error) {
    return res.status(401).json({
      mensaje: "Token inválido o expirado",
    });
  }
}
