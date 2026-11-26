import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import categoriaRoutes from "./routes/categoria.routes.js";
import limiteGastosRoutes from "./routes/limiteGastos.routes.js";
import metasRoutes from "./routes/metas.routes.js";
import { limpiarTokensExpirados } from "./services/sesion.service.js";
import { inicializarCategoriasGenerales } from "./services/categorias-seed.service.js";

const app = express();
const PORT = 3000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
  ],
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
app.use("/api/budget-limit", limiteGastosRoutes);
app.use("/api/metas", metasRoutes);

setInterval(() => limpiarTokensExpirados().catch(console.error), 60 * 60 * 1000); //Borra los tokens expirados

async function iniciarServidor() {
  try {
    await inicializarCategoriasGenerales();

    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error al inicializar el backend:", error);
    process.exitCode = 1;
  }
}

iniciarServidor();
