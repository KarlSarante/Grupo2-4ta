import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pool from "../config/database.js";

const archivoCategorias = fileURLToPath(
  new URL("../data/categorias-generales.json", import.meta.url)
);

export async function inicializarCategoriasGenerales() {
  const contenido = await readFile(archivoCategorias, "utf8");
  const categorias = JSON.parse(contenido);
  if (!Array.isArray(categorias) || categorias.length === 0) {
    throw new Error("El catálogo general debe ser un arreglo no vacío");
  }
  const vistos = new Set();
  for (const categoria of categorias) {
    if (!categoria || typeof categoria.nombre !== "string" ||
        !["ingreso", "gasto"].includes(categoria.tipo) ||
        !categoria.nombre.trim() || categoria.nombre.trim().length > 100) {
      throw new Error("Categoría general inválida en el JSON");
    }
    const nombre = categoria.nombre.trim();
    const clave = `${categoria.tipo}:${nombre.toLocaleLowerCase("es")}`;
    if (vistos.has(clave)) throw new Error("Categoría general duplicada en el JSON");
    vistos.add(clave);
  }
  for (const categoria of categorias) {
    // El índice único de generales garantiza que el seed sea repetible.
    await pool.execute(
      `INSERT INTO categorias_generales (usuario_id, nombre, tipo)
       VALUES (NULL, ?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [categoria.nombre.trim(), categoria.tipo]
    );
  }
  console.log(`Categorías generales verificadas: ${categorias.length}`);
}
