import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";
import {
  registrarCategoria,
  listarCategorias,
  desactivarCategoriaController,
} from "../controllers/categoria.controller.js";

const router = Router();

// HU004 / #66: Permitir consultar categorías a usuarios y administradores.
// La creación de categorías personales está disponible para cada cuenta.
router.get(
  "/",
  autenticarToken,
  autorizarRoles("administrador", "usuario"),
  listarCategorias
);

// HU-016: Crear una categoría PERSONAL del usuario autenticado.
// Las categorías generales solo se crean mediante el seed controlado.
router.post(
  "/",
  autenticarToken,
  autorizarRoles("administrador", "usuario"),
  registrarCategoria
);

// HU-018: Solo administradores pueden desactivar categorias generales.
router.patch(
  "/:id/desactivar",
  autenticarToken,
  autorizarRoles("administrador"),
  desactivarCategoriaController
);

export default router;