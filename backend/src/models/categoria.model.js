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
export async function crearCategoria(nombre, tipo, usuarioId = null) {
  const [resultado] = await pool.execute(
    `INSERT INTO categorias_generales (usuario_id, nombre, tipo)
     VALUES (?, ?, ?)`,
    [usuarioId, nombre, tipo]
  );

  return {
    id: resultado.insertId,
    usuario_id: usuarioId,
    nombre,
    tipo,
  };
}

// Consultar categorías generales.
// Si se proporciona un tipo, filtrar por ingreso o gasto.
export async function consultarCategorias(tipo = null, usuarioId = null, incluirTodas = false) {
  const parametros = [];
  const filtros = [];

  if (tipo !== null) {
    filtros.push("tipo = ?");
    parametros.push(tipo);
  }

  if (!incluirTodas) {
    filtros.push("(usuario_id IS NULL OR usuario_id = ?)");
    parametros.push(usuarioId);
  }

  const filtro = filtros.length > 0
    ? `WHERE ${filtros.join(" AND ")}`
    : "";

  const [categorias] = await pool.execute(
    `SELECT id, usuario_id, nombre, tipo
     FROM categorias_generales
     ${filtro}
     ORDER BY tipo ASC, nombre ASC`,
    parametros
  );

  return categorias;
}
