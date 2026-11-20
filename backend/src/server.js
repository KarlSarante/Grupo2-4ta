import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import categoriaRoutes from "./routes/categoria.routes.js";
import { limpiarTokensExpirados } from "./services/sesion.service.js";

const app = express();
const PORT = 3000;

app.use(cors({
  origin: "http://localhost:5174",
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

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
