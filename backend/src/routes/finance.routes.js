import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";
import { registrarIngreso, consultarIngresos } from "../controllers/ingreso.controller.js";
import { registrarGasto } from "../controllers/gasto.controller.js";
import { editarTransaccion, eliminarTransaccionController, obtenerGastos, obtenerTransacciones } from "../controllers/transaccion.controller.js";
import {
  guardarMeta,
  listarMetas,
  listarNotificaciones,
} from "../controllers/presupuesto.controller.js";
import {
  crearMetaFinanciera,
  listarMetasFinancieras,
  agregarAportacion,
} from "../controllers/objetivo.controller.js";

const router = Router();

// Proteger todas las rutas financieras.
// Solo pueden acceder usuarios autenticados con rol "usuario".
router.use(autenticarToken, autorizarRoles("usuario"));

// HU006: Consulta del historial general de transacciones.
router.get("/", obtenerTransacciones);
router.get("/transacciones", obtenerTransacciones);
router.get("/historial", obtenerTransacciones);
router.get("/gastos", obtenerGastos);
router.put("/transacciones/:id", editarTransaccion);
router.delete("/transacciones/:id", eliminarTransaccionController);

// HU004: Registro y consulta de ingresos.
router.post("/ingresos", registrarIngreso);
router.get("/ingresos", consultarIngresos);

// HU005: Registrar un gasto del usuario autenticado.
router.post("/gastos", registrarGasto);

router.get("/presupuestos", listarMetas);
router.post("/presupuestos", guardarMeta);
router.get("/notificaciones", listarNotificaciones);

router.get("/objetivos", listarMetasFinancieras);
router.post("/objetivos", crearMetaFinanciera);
router.post("/objetivos/:id/aportaciones", agregarAportacion);

export default router;
