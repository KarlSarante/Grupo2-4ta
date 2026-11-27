import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";
import {
  registrarCategoria,
  listarCategorias,
  actualizarCategoriaGeneralController,
  desactivarCategoriaController,
  desactivarCategoriaPersonalController,
  actualizarCategoriaPersonalController,
  reactivarCategoriaPersonalController,
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

// HU-017: Editar categoria general (como administrador)
router.put(
  "/:id",
  autenticarToken,
  autorizarRoles("administrador", "usuario"),
  (req, res, next) => {
    const controlador = req.usuario.rol === "administrador"
      ? actualizarCategoriaGeneralController
      : actualizarCategoriaPersonalController;

    return controlador(req, res, next);
  }
);

router.patch(
  "/:id/reactivar",
  autenticarToken,
  autorizarRoles("administrador", "usuario"),
  reactivarCategoriaPersonalController
);

// HU-018 / HU-021: Administradores desactivan generales; usuarios, sus personales.
router.patch(
  "/:id/desactivar",
  autenticarToken,
  autorizarRoles("administrador", "usuario"),
  (req, res, next) => {
    const controlador = req.usuario.rol === "administrador"
      ? desactivarCategoriaController
      : desactivarCategoriaPersonalController;

    return controlador(req, res, next);
  }
);

export default router;