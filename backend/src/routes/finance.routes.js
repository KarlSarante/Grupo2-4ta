import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";
import { registrarIngreso } from "../controllers/ingreso.controller.js";

const router = Router();

// Proteger todas las rutas financieras.
// Solo pueden acceder usuarios autenticados con rol "usuario".
router.use(autenticarToken, autorizarRoles("usuario"));

// Comprobar el acceso autorizado al panel financiero.
router.get("/", (req, res) => {
  return res.status(200).json({
    mensaje: "Acceso autorizado al panel financiero",
    usuario: req.usuario,
  });
});

// HU004: Registrar un ingreso del usuario autenticado.
router.post("/ingresos", registrarIngreso);

export default router;
