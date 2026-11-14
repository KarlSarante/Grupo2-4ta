import pool from "../config/database.js";

// Buscar una categoría por nombre y tipo.
export async function buscarCategoriaPorNombreYTipo(nombre, tipo) {
  const [categorias] = await pool.execute(
    `SELECT id, nombre, tipo
     FROM categorias_generales
     WHERE nombre = ? AND tipo = ?
     LIMIT 1`,
    [nombre, tipo]
  );

  return categorias[0] ?? null;
}

// Crear una categoría general.
export async function crearCategoria(nombre, tipo) {
  const [resultado] = await pool.execute(
    `INSERT INTO categorias_generales (nombre, tipo)
     VALUES (?, ?)`,
    [nombre, tipo]
  );

  return {
    id: resultado.insertId,
    nombre,
    tipo,
  };
}

// Consultar categorías generales.
// Si se proporciona un tipo, filtrar por ingreso o gasto.
export async function consultarCategorias(tipo = null) {
  if (tipo !== null) {
    const [categorias] = await pool.execute(
      `SELECT id, nombre, tipo
       FROM categorias_generales
       WHERE tipo = ?
       ORDER BY nombre ASC`,
      [tipo]
    );

    return categorias;
  }

  const [categorias] = await pool.execute(
    `SELECT id, nombre, tipo
     FROM categorias_generales
     ORDER BY tipo ASC, nombre ASC`
  );

  return categorias;
}
