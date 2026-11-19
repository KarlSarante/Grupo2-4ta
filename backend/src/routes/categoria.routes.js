import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";
import {
  registrarCategoria,
  listarCategorias,
} from "../controllers/categoria.controller.js";

const router = Router();

// HU004 / #66: Permitir consultar categorías a usuarios y administradores.
// La creación de categorías continúa reservada a administradores.
router.get(
  "/",
  autenticarToken,
  autorizarRoles("administrador", "usuario"),
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