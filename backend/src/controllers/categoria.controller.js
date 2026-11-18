import { z } from "zod";
import { crearCategoria, buscarCategoriaPorNombreYTipo } from "../models/categoria.model.js";


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
        const categoriaExistente = await buscarCategoriaPorNombreYTipo(
            nombre, tipo
        );

        if (categoriaExistente) {
            return res.status(409).json({
                mensaje: "Ya existe una categoría con ese nombre y tipo",
            });
        }

        const categoria = await crearCategoria(nombre, tipo);

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
