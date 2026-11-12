
import { z } from "zod";
import bcrypt from "bcrypt";
import pool from "../config/database.js";
import { generarToken } from "../utils/jwt.js";

const loginSchema = z.strictObject({
  email: z.email().trim().toLowerCase().max(255),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export async function iniciarSesion(req, res) {
  const resultado = loginSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      mensaje: "Datos de inicio de sesión inválidos",
      errores: resultado.error.issues.map((error) => ({
        campo: error.path.join("."),
        mensaje: error.message,
      })),
    });
  }

  const { email, password } = resultado.data;

  try {
    const [usuarios] = await pool.execute(
      `SELECT id, nombre, email, password_hash, rol, activo
       FROM usuarios
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje: "Correo electrónico o contraseña incorrectos",
      });
    }

    const usuario = usuarios[0];

    if (!usuario.activo) {
      return res.status(403).json({
        mensaje: "La cuenta se encuentra desactivada",
      });
    }

    const passwordValida = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!passwordValida) {
      return res.status(401).json({
        mensaje: "Correo electrónico o contraseña incorrectos",
      });
    }

    const token = generarToken(usuario);

    return res.status(200).json({
      mensaje: "Inicio de sesión exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error interno al iniciar sesión:", error);

    return res.status(500).json({
      mensaje: "Ocurrió un error interno del servidor",
    });
  }
}
