import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";

import {
  obtenerLimiteGastos,
  actualizarLimiteGastos,
} from "../controllers/limiteGastos.controller.js";

const router = Router();

router.use(
  autenticarToken,
  autorizarRoles("usuario")
);

router.get("/", obtenerLimiteGastos);
router.put("/", actualizarLimiteGastos);

export default router;
