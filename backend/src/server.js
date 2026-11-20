import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import categoriaRoutes from "./routes/categoria.routes.js";
import { limpiarTokensExpirados } from "./services/sesion.service.js";
import { inicializarCategoriasGenerales } from "./services/categorias-seed.service.js";

const app = express();
const PORT = 3000;
const origenesPermitidos = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
]);

app.use(cors({
  origin: (origen, callback) => {
    if (!origen || origenesPermitidos.has(origen)) {
      return callback(null, true);
    }

    return callback(new Error("Origen no permitido por CORS"));
  },
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API de Finanzas Personales funcionando");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/finanzas", financeRoutes);
app.use("/api/transactions", financeRoutes);
app.use("/api/categorias", categoriaRoutes);

setInterval(() => limpiarTokensExpirados().catch(console.error), 60 * 60 * 1000); //Borra los tokens expirados

async function iniciarServidor() {
  try {
    await inicializarCategoriasGenerales();

    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("No se pudieron inicializar las categorías generales:", error);
    process.exit(1);
  }
}

iniciarServidor();
