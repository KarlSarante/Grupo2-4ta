import pool from "../config/database.js";

export function autorizarRoles(...rolesPermitidos) {
  return async (req, res, next) => {
    if (!req.usuario || !Number.isInteger(req.usuario.id)) {
      return res.status(401).json({
        mensaje: "Autenticación requerida",
      });
    }

    try {
      const [usuarios] = await pool.execute(
        `SELECT rol, activo
         FROM usuarios
         WHERE id = ?
         LIMIT 1`,
        [req.usuario.id]
      );

      if (usuarios.length === 0) {
        return res.status(401).json({
          mensaje: "La cuenta ya no existe",
        });
      }

      const usuario = usuarios[0];

      if (!usuario.activo) {
        return res.status(403).json({
          mensaje: "La cuenta se encuentra desactivada",
        });
      }

      if (!rolesPermitidos.includes(usuario.rol)) {
        return res.status(403).json({
          mensaje: "No tienes permisos para acceder a este recurso",
        });
      }

      req.usuario.rol = usuario.rol;

      next();
    } catch (error) {
      console.error("Error al verificar permisos:", error);

      return res.status(500).json({
        mensaje: "Error interno al verificar permisos",
      });
    }
  };
}
