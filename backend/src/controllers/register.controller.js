import { z } from "zod";
import bcrypt from "bcrypt";
import pool from "../config/database.js";

const registroSchema = z.strictObject({
  nombre: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase().max(255),
  password: z.string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .refine((valor) => Buffer.byteLength
  (valor, "utf8") <= 72, 
  "La contraseña no puede superar los 72 bytes"),
});

export async function registrarUsuario(req, res) {
  const resultado = registroSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      mensaje: "Datos de registro inválidos",
      errores: resultado.error.issues.map((error) => ({
        campo: error.path.join("."),
        mensaje: error.message,
      })),
    });
  }

  const { nombre, email, password } = resultado.data;

  try {
    const [usuariosExistentes] = await pool.execute(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [email]
    );

    if (usuariosExistentes.length > 0) {
      return res.status(409).json({
        mensaje: "El correo electrónico ya está registrado",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [resultadoInsert] = await pool.execute(
      `INSERT INTO usuarios (nombre, email, password_hash)
       VALUES (?, ?, ?)`,
      [nombre, email, passwordHash]
    );

    return res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario: {
        id: resultadoInsert.insertId,
        nombre,
        email,
        rol: "usuario",
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensaje: "El correo electrónico ya está registrado",
      });
    }

    console.error("Error interno al registrar usuario:", error);

    return res.status(500).json({
      mensaje: "Ocurrió un error interno del servidor",
    });
  }
}
