import { z } from "zod";
import {
    actualizarCategoriaPersonal,
    actualizarCategoriaGeneral,
    crearCategoria,
    buscarCategoriaPorNombreYTipo,
    consultarCategorias,
    consultarCategoriaPorId,
    desactivarCategoriaGeneral,
    reactivarCategoriaPersonal,
    desactivarCategoriaPersonal,
} from "../models/categoria.model.js";

const categoriaSchema = z.strictObject({
    nombre: z.string()
        .trim()
        .min(1, "El nombre de la categoría es obligatorio")
        .max(100, "El nombre no puede superar los 100 caracteres")
        .refine(
            (nombre) => !/[\x00-\x1F\x7F]/.test(nombre),
            "El nombre contiene caracteres no permitidos"
        ),

    tipo: z.enum(["ingreso", "gasto"], {
        error: (issue) =>
            issue.input === undefined
                ? "El tipo de categoría es obligatorio"
                : "El tipo de categoría debe ser ingreso o gasto",
    }),
});

function formatearErrores(issues) {
    return issues.map((error) => {
        if (error.code === "unrecognized_keys") {
            const campos = error.keys.join(", ");

            return {
                campo: campos,
                mensaje: `Se enviaron campos no permitidos: ${campos}`,
            };
        }

        return {
            campo: error.path.join("."),
            mensaje: error.message,
        };
    });
}

export async function registrarCategoria(req, res) {
    const resultado = categoriaSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({
            mensaje: "Datos de categoría inválidos",
            errores: formatearErrores(resultado.error.issues),
        });
    }

    const { nombre, tipo } = resultado.data;

    try {
        // Administradores crean categorias generales; usuarios crean categorias personales.
        const usuarioId =
            req.usuario.rol === "administrador"
                ? null
                : req.usuario.id;
        const categoriaExistente = await buscarCategoriaPorNombreYTipo(
            nombre, tipo, usuarioId
        );

        if (categoriaExistente) {
            return res.status(409).json({
                mensaje: "Ya existe una categoría con ese nombre y tipo",
            });
        }

        const categoria = await crearCategoria(nombre, tipo, usuarioId);

        return res.status(201).json({
            mensaje: "Categoría creada correctamente",
            categoria,
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensaje: "Ya existe una categoría con ese nombre y tipo",
            });
        }

        console.error("Error al crear categoría:", error);

        return res.status(500).json({
            mensaje: "Error interno al crear la categoría",
        });
    }
}

export async function actualizarCategoriaPersonalController(req, res) {
    const idTexto = req.params.id;

    if (typeof idTexto !== "string" || !/^[1-9]\d*$/.test(idTexto)) {
        return res.status(400).json({
            mensaje: "El ID de categoría debe ser un entero positivo",
        });
    }

    const id = Number(idTexto);

    if (!Number.isSafeInteger(id) || id > 2147483647) {
        return res.status(400).json({
            mensaje: "ID de categoría inválido",
        });
    }

    const resultado = categoriaSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({
            mensaje: "Datos de categoría inválidos",
            errores: formatearErrores(resultado.error.issues),
        });
    }

    try {
        const resultadoActualizacion = await actualizarCategoriaPersonal(
            id,
            req.usuario.id,
            resultado.data.nombre,
            resultado.data.tipo
        );

        if (resultadoActualizacion.estado === "no_encontrada") {
            return res.status(404).json({
                mensaje: "Categoría no encontrada",
            });
        }

        if (resultadoActualizacion.estado === "sin_permiso") {
            return res.status(403).json({
                mensaje: "No tienes permiso para editar esta categoría",
            });
        }

        if (resultadoActualizacion.estado === "tipo_bloqueado") {
            const mensaje =
                "No se puede cambiar el tipo de una categoría que tiene transacciones asociadas";

            return res.status(409).json({
                mensaje,
                errores: [{ campo: "tipo", mensaje }],
            });
        }

        if (resultadoActualizacion.estado === "duplicada") {
            const mensaje = "Ya existe una categoría con ese nombre y tipo";

            return res.status(409).json({
                mensaje,
                errores: [{ campo: "nombre", mensaje }],
            });
        }

        return res.status(200).json({
            mensaje: "Categoría actualizada correctamente",
            categoria: resultadoActualizacion.categoria,
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            const mensaje = "Ya existe una categoría con ese nombre y tipo";

            return res.status(409).json({
                mensaje,
                errores: [{ campo: "nombre", mensaje }],
            });
        }

        console.error("Error al actualizar categoría personal:", error);

        return res.status(500).json({
            mensaje: "Error interno al actualizar la categoría",
        });
    }
}

export async function actualizarCategoriaGeneralController(req, res) {
    if (req.usuario?.rol !== "administrador") {
        return res.status(403).json({
            mensaje: "No tienes permiso para editar categorías generales",
        });
    }

    const idTexto = req.params.id;

    if (typeof idTexto !== "string" || !/^[1-9]\d*$/.test(idTexto)) {
        return res.status(400).json({
            mensaje: "El ID de categoría debe ser un entero positivo",
        });
    }

    const id = Number(idTexto);

    if (!Number.isSafeInteger(id) || id > 2147483647) {
        return res.status(400).json({
            mensaje: "ID de categoría inválido",
        });
    }

    const resultado = categoriaSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({
            mensaje: "Datos de categoría inválidos",
            errores: formatearErrores(resultado.error.issues),
        });
    }

    try {
        const actualizacion = await actualizarCategoriaGeneral(
            id,
            resultado.data.nombre,
            resultado.data.tipo
        );

        if (actualizacion.estado === "no_encontrada") {
            return res.status(404).json({
                mensaje: "Categoría no encontrada",
            });
        }

        if (actualizacion.estado === "no_general") {
            return res.status(403).json({
                mensaje: "No se pueden editar categorías personales desde administración",
            });
        }

        if (actualizacion.estado === "tipo_bloqueado") {
            const mensaje =
                "No se puede cambiar el tipo de una categoría que tiene transacciones asociadas";

            return res.status(409).json({
                mensaje,
                errores: [{ campo: "tipo", mensaje }],
            });
        }

        if (actualizacion.estado === "duplicada") {
            const mensaje = "Ya existe una categoría con ese nombre y tipo";

            return res.status(409).json({
                mensaje,
                errores: [{ campo: "nombre", mensaje }],
            });
        }

        return res.status(200).json({
            mensaje: "Categoría general actualizada correctamente",
            categoria: actualizacion.categoria,
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            const mensaje = "Ya existe una categoría con ese nombre y tipo";

            return res.status(409).json({
                mensaje,
                errores: [{ campo: "nombre", mensaje }],
            });
        }

        console.error("Error al actualizar categoría general:", error);

        return res.status(500).json({
            mensaje: "Error interno al actualizar la categoría",
        });
    }
}

export async function reactivarCategoriaPersonalController(req, res) {
    const idTexto = req.params.id;

    if (typeof idTexto !== "string" || !/^[1-9]\d*$/.test(idTexto)) {
        return res.status(400).json({
            mensaje: "El ID de categoría debe ser un entero positivo",
        });
    }

    const id = Number(idTexto);

    if (!Number.isSafeInteger(id) || id > 2147483647) {
        return res.status(400).json({
            mensaje: "ID de categoría inválido",
        });
    }

    try {
        const resultado = await reactivarCategoriaPersonal(id, req.usuario.id);

        if (resultado.estado === "no_encontrada") {
            return res.status(404).json({
                mensaje: "Categoría no encontrada",
            });
        }

        if (resultado.estado === "sin_permiso") {
            return res.status(403).json({
                mensaje: "No tienes permiso para reactivar esta categoría",
            });
        }

        if (resultado.estado === "ya_activa") {
            return res.status(409).json({
                mensaje: "La categoría ya está activa",
            });
        }

        return res.status(200).json({
            mensaje: "Categoría personal reactivada correctamente",
            categoria: resultado.categoria,
        });
    } catch (error) {
        console.error("Error al reactivar categoría personal:", error);

        return res.status(500).json({
            mensaje: "Error interno al reactivar la categoría",
        });
    }
}

/**
 * HU-016: Consultar categorías generales.
 *
 * GET /api/categorias
 *
 * Devuelve las categorías registradas en MySQL.
 * Permite filtrar opcionalmente por tipo:
 * ?tipo=ingreso o ?tipo=gasto
 */
export async function listarCategorias(req, res) {
    const { tipo, incluir_inactivas: incluirInactivasQuery } = req.query;

    // Validar el filtro cuando se proporciona.
    if (tipo !== undefined && !["ingreso", "gasto"].includes(tipo)) {
        return res.status(400).json({
            mensaje: "El tipo debe ser ingreso o gasto",
        });
    }

    if (
        incluirInactivasQuery !== undefined &&
        !["true", "false"].includes(incluirInactivasQuery)
    ) {
        return res.status(400).json({
            mensaje: "El filtro incluir_inactivas debe ser true o false",
        });
    }

    try {
        // Reutilizar la consulta existente del modelo.
        const usuarioId =
            req.usuario.rol === "administrador"
                ? null
                : req.usuario.id;

        const categorias = await consultarCategorias(
            tipo ?? null,
            usuarioId,
            req.usuario.rol === "usuario" && incluirInactivasQuery === "true"
        );

        return res.status(200).json({
            mensaje: "Categorías consultadas correctamente",
            categorias,
        });
    } catch (error) {
        console.error("Error al consultar categorías:", error);

        return res.status(500).json({
            mensaje: "Error interno al consultar las categorías",
        });
    }
}

/**
 * HU-018: Desactivar una categoría general.
 */
export async function desactivarCategoriaController(req, res) {
    if (req.usuario?.rol !== "administrador") {
        return res.status(403).json({
            mensaje: "No tienes permiso para desactivar categorías generales",
        });
    }

    const idTexto = req.params.id;

    if (typeof idTexto !== "string" || !/^[1-9]\d*$/.test(idTexto)) {
        return res.status(400).json({
            mensaje: "El ID de categoría debe ser un entero positivo",
        });
    }

    const id = Number(idTexto);

    if (!Number.isSafeInteger(id) || id > 2147483647) {
        return res.status(400).json({
            mensaje: "ID de categoría inválido",
        });
    }

    try {
        const categoria = await consultarCategoriaPorId(id);

        if (!categoria) {
            return res.status(404).json({
                mensaje: "Categoría no encontrada",
            });
        }

        if (categoria.usuario_id !== null) {
            return res.status(403).json({
                mensaje: "No se pueden desactivar categorías personales",
            });
        }

        if (!categoria.activo) {
            return res.status(409).json({
                mensaje: "La categoría ya está desactivada",
            });
        }

        const filasAfectadas = await desactivarCategoriaGeneral(id);

        if (filasAfectadas !== 1) {
            return res.status(409).json({
                mensaje: "La categoría ya no está activa",
            });
        }

        return res.status(200).json({
            mensaje: "Categoría general desactivada correctamente",
            categoria: {
                id,
                activo: false,
            },
        });
    } catch (error) {
        console.error("Error al desactivar categoría:", error);

        return res.status(500).json({
            mensaje: "Error interno al desactivar la categoría",
        });
    }
}

export async function desactivarCategoriaPersonalController(req, res) {
    const idTexto = req.params.id;

    if (typeof idTexto !== "string" || !/^[1-9]\d*$/.test(idTexto)) {
        return res.status(400).json({
            mensaje: "El ID de categoría debe ser un entero positivo",
        });
    }

    const id = Number(idTexto);

    if (!Number.isSafeInteger(id) || id > 2147483647) {
        return res.status(400).json({
            mensaje: "ID de categoría inválido",
        });
    }

    try {
        const resultado = await desactivarCategoriaPersonal(id, req.usuario.id);

        if (resultado.estado === "no_encontrada") {
            return res.status(404).json({
                mensaje: "Categoría no encontrada",
            });
        }

        if (resultado.estado === "sin_permiso") {
            return res.status(403).json({
                mensaje: "No tienes permiso para desactivar esta categoría",
            });
        }

        if (resultado.estado === "ya_inactiva") {
            return res.status(409).json({
                mensaje: "La categoría ya está desactivada",
            });
        }

        return res.status(200).json({
            mensaje: "Categoría personal desactivada correctamente",
            categoria: resultado.categoria,
        });
    } catch (error) {
        console.error("Error al desactivar categoría personal:", error);

        return res.status(500).json({
            mensaje: "Error interno al desactivar la categoría",
        });
    }
}
