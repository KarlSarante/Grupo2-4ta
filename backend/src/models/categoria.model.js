import pool from "../config/database.js";

// La unicidad se aplica por ámbito: general (NULL) o usuario concreto.
export async function buscarCategoriaPorNombreYTipo(nombre, tipo, usuarioId = null) {
  const filtro = usuarioId === null ? "usuario_id IS NULL" : "usuario_id = ?";
  const parametros = usuarioId === null ? [nombre, tipo] : [nombre, tipo, usuarioId];
  const [categorias] = await pool.execute(
    `SELECT id, usuario_id, nombre, tipo FROM categorias_generales
     WHERE nombre = ? AND tipo = ? AND ${filtro} LIMIT 1`,
    parametros
  );
  return categorias[0] ?? null;
}

export async function crearCategoria(nombre, tipo, usuarioId = null) {
  const [resultado] = await pool.execute(
    `INSERT INTO categorias_generales (usuario_id, nombre, tipo) VALUES (?, ?, ?)`,
    [usuarioId, nombre, tipo]
  );
  return { id: resultado.insertId, usuario_id: usuarioId, nombre, tipo };
}

// Nunca devolver categorías privadas de otros usuarios, incluso a administradores.
export async function consultarCategorias(tipo = null, usuarioId = null) {
  const parametros = [];
  const filtros = [];
  if (tipo !== null) { filtros.push("tipo = ?"); parametros.push(tipo); }
  if (usuarioId === null) {
    filtros.push("usuario_id IS NULL");
  } else {
    filtros.push("(usuario_id IS NULL OR usuario_id = ?)");
    parametros.push(usuarioId);
    filtros.push("activo = TRUE");
  }
  const [categorias] = await pool.execute(
    `SELECT id, usuario_id, nombre, tipo, activo FROM categorias_generales
     WHERE ${filtros.join(" AND ")} ORDER BY tipo ASC, nombre ASC, id ASC`,
    parametros
  );
  return categorias;
}

// HU-018: Desactivar exclusivamente una categoria general activa.
export async function desactivarCategoriaGeneral(id) {
    const [resultado] = await pool.execute(
        `UPDATE categorias_generales
         SET activo = FALSE
         WHERE id = ?
           AND usuario_id IS NULL
           AND activo = TRUE`,
        [id]
    );

    return resultado.affectedRows;
}

// HU-018: Consultar el estado y propietario de una categoria por ID.
export async function consultarCategoriaPorId(id) {
    const [categorias] = await pool.execute(
        `SELECT id, usuario_id, activo
         FROM categorias_generales
         WHERE id = ?`,
        [id]
    );

    return categorias[0] ?? null;
}
