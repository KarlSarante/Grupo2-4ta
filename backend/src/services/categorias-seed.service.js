import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pool from "../config/database.js";

const archivoCategorias = fileURLToPath(
  new URL("../data/categorias-generales.json", import.meta.url)
);

async function leerCategoriasGenerales() {
  const contenido = await readFile(archivoCategorias, "utf8");
  const categorias = JSON.parse(contenido);

  if (
    !Array.isArray(categorias) ||
    categorias.some(
      (categoria) =>
        !categoria ||
        typeof categoria.nombre !== "string" ||
        !["ingreso", "gasto"].includes(categoria.tipo)
    )
  ) {
    throw new Error("El archivo de categorías generales no tiene un formato válido");
  }

  return categorias;
}

export async function inicializarCategoriasGenerales() {
  const categorias = await leerCategoriasGenerales();

  for (const categoria of categorias) {
    await pool.execute(
      `INSERT INTO categorias_generales
        (usuario_id, nombre, tipo)
       VALUES (NULL, ?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [categoria.nombre.trim(), categoria.tipo]
    );
  }

  console.log(
    `Categorías generales verificadas: ${categorias.length}`
  );
}
