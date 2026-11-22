import pool from "../config/database.js";

export async function consultarUsuarios(req, res) {
  try {
    const [usuarios] = await pool.execute(
      `SELECT id, nombre, email, rol, activo
       FROM usuarios
       ORDER BY id ASC`
    );

    return res.status(200).json({
      usuarios,
    });
  } catch (error) {
    console.error("Error al consultar usuarios:", error);

    return res.status(500).json({
      mensaje: "Error interno al consultar usuarios",
    });
  }
}

// HU-014: Desactivar una cuenta de usuario.
export async function desactivarUsuarioController(req, res) {
  const idTexto = req.params.id;

  if (
    typeof idTexto !== "string" ||
    !/^[1-9]\d*$/.test(idTexto)
  ) {
    return res.status(400).json({
      mensaje: "El ID de usuario debe ser un entero positivo",
    });
  }

  const id = Number(idTexto);

  if (!Number.isSafeInteger(id) || id > 2147483647) {
    return res.status(400).json({
      mensaje: "ID de usuario invalido",
    });
  }

  if (id === req.usuario?.id) {
    return res.status(403).json({
      mensaje: "No puedes desactivar tu propia cuenta",
    });
  }

  let connection;
  let transaccionIniciada = false;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transaccionIniciada = true;

    const [usuarios] = await connection.execute(
      `SELECT id, rol, activo
       FROM usuarios
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [id]
    );

    if (usuarios.length === 0) {
      await connection.rollback();
      transaccionIniciada = false;

      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    const usuarioObjetivo = usuarios[0];

    if (usuarioObjetivo.rol !== "usuario") {
      await connection.rollback();
      transaccionIniciada = false;

      return res.status(403).json({
        mensaje: "Solo se pueden desactivar cuentas de usuario",
      });
    }

    if (!usuarioObjetivo.activo) {
      await connection.rollback();
      transaccionIniciada = false;

      return res.status(409).json({
        mensaje: "La cuenta ya se encuentra desactivada",
      });
    }

    const [resultado] = await connection.execute(
      `UPDATE usuarios
       SET activo = FALSE,
           token_version = token_version + 1
       WHERE id = ?
         AND rol = 'usuario'
         AND activo = TRUE`,
      [id]
    );

    if (resultado.affectedRows !== 1) {
      throw new Error("No se pudo completar la desactivacion");
    }

    await connection.commit();
    transaccionIniciada = false;

    return res.status(200).json({
      mensaje: "Cuenta desactivada correctamente",
      usuario: {
        id,
        activo: false,
      },
    });
  } catch (error) {
    if (connection && transaccionIniciada) {
      try {
        await connection.rollback();
      } catch (errorRollback) {
        console.error("Error al revertir desactivacion:", errorRollback);
      }
    }

    console.error("Error al desactivar cuenta:", error);

    return res.status(500).json({
      mensaje: "Error interno al desactivar la cuenta",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}