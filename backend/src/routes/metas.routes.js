import { Router } from "express";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/role.middleware.js";
import { eliminarMetaFinanciera } from "../controllers/objetivo.controller.js";

const router = Router();

router.delete(
  "/:id",
  autenticarToken,
  autorizarRoles("usuario"),
  eliminarMetaFinanciera
);

export default router;
