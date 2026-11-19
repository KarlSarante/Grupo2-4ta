import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";
import {
  registrarIngreso,
  consultarIngresos,
} from "../controllers/ingreso.controller.js";
import {
  obtenerGastos,
  obtenerTransacciones,
} from "../controllers/transaccion.controller.js";

const router = Router();

// Proteger todas las rutas financieras.
// Solo pueden acceder usuarios autenticados con rol "usuario".
router.use(autenticarToken, autorizarRoles("usuario"));

// HU006: Consulta del historial general de transacciones.
router.get("/", obtenerTransacciones);
router.get("/transacciones", obtenerTransacciones);
router.get("/historial", obtenerTransacciones);
router.get("/gastos", obtenerGastos);

// HU004: Registro y consulta de ingresos.
router.post("/ingresos", registrarIngreso);
router.get("/ingresos", consultarIngresos);

export default router;
