
import "dotenv/config";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

if (!JWT_SECRET) {
  throw new Error("La variable JWT_SECRET no está configurada");
}

export function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      rol: usuario.rol,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      jwtid: randomUUID(), // identificador único: permite invalidar este token
    }
  );
}

export function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
