import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";
import {
  registrarCategoria,
  listarCategorias,
} from "../controllers/categoria.controller.js";

const router = Router();

// HU004 / #66: Permitir consultar categorías a usuarios y administradores.
router.get(
  "/",
  autenticarToken,
  autorizarRoles("administrador", "usuario"),
  listarCategorias
);

// HU-016: Crear categorías generales o personales.
router.post(
  "/",
  autenticarToken,
  autorizarRoles("administrador", "usuario"),
  registrarCategoria
);

export default router;