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

export async function actualizarCategoriaPersonal(id, usuarioId, nombre, tipo) {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [categorias] = await conexion.execute(
      `SELECT id, usuario_id, nombre, tipo, activo
       FROM categorias_generales
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );
    const categoria = categorias[0];

    if (!categoria) {
      await conexion.rollback();
      return { estado: "no_encontrada" };
    }

    if (
      categoria.usuario_id === null ||
      Number(categoria.usuario_id) !== Number(usuarioId)
    ) {
      await conexion.rollback();
      return { estado: "sin_permiso" };
    }

    if (categoria.tipo !== tipo) {
      const [transacciones] = await conexion.execute(
        `SELECT id
         FROM transacciones
         WHERE categoria_id = ?
         LIMIT 1`,
        [id]
      );

      if (transacciones.length > 0) {
        await conexion.rollback();
        return { estado: "tipo_bloqueado" };
      }
    }

    if (categoria.nombre === nombre && categoria.tipo === tipo) {
      await conexion.commit();
      return { estado: "actualizada", categoria };
    }

    const [duplicadas] = await conexion.execute(
      `SELECT id
       FROM categorias_generales
       WHERE usuario_id = ?
         AND nombre = ?
         AND tipo = ?
         AND id <> ?
       LIMIT 1`,
      [usuarioId, nombre, tipo, id]
    );

    if (duplicadas.length > 0) {
      await conexion.rollback();
      return { estado: "duplicada" };
    }

    const [resultado] = await conexion.execute(
      `UPDATE categorias_generales
       SET nombre = ?, tipo = ?
       WHERE id = ? AND usuario_id = ?`,
      [nombre, tipo, id, usuarioId]
    );

    if (resultado.affectedRows !== 1) {
      await conexion.rollback();
      return { estado: "no_encontrada" };
    }

    await conexion.commit();

    return {
      estado: "actualizada",
      categoria: {
        ...categoria,
        nombre,
        tipo,
      },
    };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function reactivarCategoriaPersonal(id, usuarioId) {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [categorias] = await conexion.execute(
      `SELECT id, usuario_id, nombre, tipo, activo
       FROM categorias_generales
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );
    const categoria = categorias[0];

    if (!categoria) {
      await conexion.rollback();
      return { estado: "no_encontrada" };
    }

    if (
      categoria.usuario_id === null ||
      Number(categoria.usuario_id) !== Number(usuarioId)
    ) {
      await conexion.rollback();
      return { estado: "sin_permiso" };
    }

    if (categoria.activo) {
      await conexion.rollback();
      return { estado: "ya_activa" };
    }

    const [resultado] = await conexion.execute(
      `UPDATE categorias_generales
       SET activo = TRUE
       WHERE id = ? AND usuario_id = ? AND activo = FALSE`,
      [id, usuarioId]
    );

    if (resultado.affectedRows !== 1) {
      await conexion.rollback();
      return { estado: "no_encontrada" };
    }

    await conexion.commit();

    return {
      estado: "reactivada",
      categoria: {
        ...categoria,
        activo: true,
      },
    };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function desactivarCategoriaPersonal(id, usuarioId) {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [categorias] = await conexion.execute(
      `SELECT id, usuario_id, nombre, tipo, activo
       FROM categorias_generales
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );
    const categoria = categorias[0];

    if (!categoria) {
      await conexion.rollback();
      return { estado: "no_encontrada" };
    }

    if (
      categoria.usuario_id === null ||
      Number(categoria.usuario_id) !== Number(usuarioId)
    ) {
      await conexion.rollback();
      return { estado: "sin_permiso" };
    }

    if (!categoria.activo) {
      await conexion.rollback();
      return { estado: "ya_inactiva" };
    }

    const [resultado] = await conexion.execute(
      `UPDATE categorias_generales
       SET activo = FALSE
       WHERE id = ? AND usuario_id = ? AND activo = TRUE`,
      [id, usuarioId]
    );

    if (resultado.affectedRows !== 1) {
      await conexion.rollback();
      return { estado: "no_encontrada" };
    }

    await conexion.commit();

    return {
      estado: "desactivada",
      categoria: {
        ...categoria,
        activo: false,
      },
    };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Nunca devolver categorías privadas de otros usuarios, incluso a administradores.
export async function consultarCategorias(
  tipo = null,
  usuarioId = null,
  incluirInactivas = false
) {
  const parametros = [];
  const filtros = [];
  if (tipo !== null) { filtros.push("tipo = ?"); parametros.push(tipo); }
  if (usuarioId === null) {
    filtros.push("usuario_id IS NULL");
  } else if (incluirInactivas) {
    filtros.push("(usuario_id IS NULL AND activo = TRUE OR usuario_id = ?)");
    parametros.push(usuarioId);
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

// La edición administrativa solo puede modificar categorías generales.
export async function actualizarCategoriaGeneral(id, nombre, tipo) {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [categorias] = await conexion.execute(
      `SELECT id, usuario_id, nombre, tipo, activo
             FROM categorias_generales
             WHERE id = ?
             FOR UPDATE`,
      [id]
    );
    const categoria = categorias[0];

    if (!categoria) {
      await conexion.rollback();
      return { estado: "no_encontrada" };
    }

    if (categoria.usuario_id !== null) {
      await conexion.rollback();
      return { estado: "no_general" };
    }

    if (categoria.nombre === nombre && categoria.tipo === tipo) {
      await conexion.commit();
      return { estado: "actualizada", categoria };
    }

    if (categoria.tipo !== tipo) {
      const [transacciones] = await conexion.execute(
        `SELECT id
                 FROM transacciones
                 WHERE categoria_id = ?
                 LIMIT 1`,
        [id]
      );

      if (transacciones.length > 0) {
        await conexion.rollback();
        return { estado: "tipo_bloqueado" };
      }
    }

    const [duplicadas] = await conexion.execute(
      `SELECT id
             FROM categorias_generales
             WHERE usuario_id IS NULL
               AND nombre = ?
               AND tipo = ?
               AND id <> ?
             LIMIT 1`,
      [nombre, tipo, id]
    );

    if (duplicadas.length > 0) {
      await conexion.rollback();
      return { estado: "duplicada" };
    }

    const [resultado] = await conexion.execute(
      `UPDATE categorias_generales
             SET nombre = ?, tipo = ?
             WHERE id = ? AND usuario_id IS NULL`,
      [nombre, tipo, id]
    );

    if (resultado.affectedRows !== 1) {
      await conexion.rollback();
      return { estado: "no_encontrada" };
    }

    await conexion.commit();

    return {
      estado: "actualizada",
      categoria: {
        ...categoria,
        nombre,
        tipo,
      },
    };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
