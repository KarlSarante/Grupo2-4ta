import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";
import { consultarUsuarios } from "../controllers/admin.controller.js";

const router = Router();

// Proteger todas las rutas administrativas.
router.use(autenticarToken, autorizarRoles("administrador"));

// Verificar el acceso al panel administrativo.
router.get("/", (req, res) => {
  return res.status(200).json({
    mensaje: "Acceso autorizado al panel administrativo",
    usuario: req.usuario,
  });
});

// Consultar las cuentas registradas.
// Solo devuelve datos administrativos permitidos.
router.get("/usuarios", consultarUsuarios);

export default router;
