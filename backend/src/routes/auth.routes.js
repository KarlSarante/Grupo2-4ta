
import { Router } from "express";
import { registrarUsuario } from "../controllers/register.controller.js";
import { iniciarSesion } from "../controllers/login.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { revocarToken } from "../services/sesion.service.js";    

const router = Router();

router.post("/register", registrarUsuario);
router.post("/login", iniciarSesion);

router.get("/me", autenticarToken, (req, res) => {
  return res.status(200).json({
    mensaje: "Token válido. Acceso autorizado.",
    usuario: req.usuario,
  });
});

// Cierre de sesión: POST /api/auth/logout
// Invalida el token actual: desde este momento autenticarToken lo rechaza.
router.post("/logout", autenticarToken, async (req, res) => {
  try {
    await revocarToken(req.usuario);
    return res.status(200).json({
      mensaje: "Sesión cerrada correctamente",
    });
  } catch (error) {
    console.error("Error al invalidar la sesión:", error);
    return res.status(500).json({
      mensaje: "No se pudo invalidar la sesión",
    });
  }
});

export default router;
