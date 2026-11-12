
import { Router } from "express";
import { registrarUsuario } from "../controllers/register.controller.js";
import { iniciarSesion } from "../controllers/login.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";    

const router = Router();

router.post("/register", registrarUsuario);
router.post("/login", iniciarSesion);

router.get("/me", autenticarToken, (req, res) => {
  return res.status(200).json({
    mensaje: "Token válido. Acceso autorizado.",
    usuario: req.usuario,
  });
});
export default router;
