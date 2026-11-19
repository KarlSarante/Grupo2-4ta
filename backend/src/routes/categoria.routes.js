import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";
import {
  registrarCategoria,
  listarCategorias,
} from "../controllers/categoria.controller.js";

const router = Router();

// HU-016: Consultar categorías generales.
// Solo los administradores pueden acceder al listado.
router.get(
  "/",
  autenticarToken,
  autorizarRoles("administrador"),
  listarCategorias
);

// HU-016: Crear categorías generales.
// Solo los administradores pueden registrar categorías.
router.post(
  "/",
  autenticarToken,
  autorizarRoles("administrador"),
  registrarCategoria
);

export default router;