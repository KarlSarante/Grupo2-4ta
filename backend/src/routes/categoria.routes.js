import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";
import { registrarCategoria } from "../controllers/categoria.controller.js";

const router = Router();

// Solo los administradores pueden crear categorías.
router.post(
  "/",
  autenticarToken,
  autorizarRoles("administrador"),
  registrarCategoria
);

export default router;
