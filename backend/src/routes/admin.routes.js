import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(autenticarToken, autorizarRoles("administrador"));

router.get("/", (req, res) => {
  return res.status(200).json({
    mensaje: "Acceso autorizado al panel administrativo",
    usuario: req.usuario,
  });
});

export default router;
