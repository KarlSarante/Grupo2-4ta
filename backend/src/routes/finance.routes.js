import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";
import {
  obtenerGastos,
  obtenerIngresos,
  obtenerTransacciones,
} from "../controllers/transaccion.controller.js";

const router = Router();

router.use(autenticarToken, autorizarRoles("usuario"));

router.get("/", obtenerTransacciones);
router.get("/transacciones", obtenerTransacciones);
router.get("/historial", obtenerTransacciones);
router.get("/ingresos", obtenerIngresos);
router.get("/gastos", obtenerGastos);

export default router;
