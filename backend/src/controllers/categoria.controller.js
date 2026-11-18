import { crearCategoria } from "../models/categoria.model.js";

export async function registrarCategoria(req, res) {
  try {
    const { nombre, tipo } = req.body;

    const categoria = await crearCategoria(nombre, tipo);

    return res.status(201).json({
      mensaje: "Categoría creada correctamente",
      categoria,
    });
  } catch (error) {
    console.error("Error al crear categoría:", error);

    return res.status(500).json({
      mensaje: "Error interno al crear la categoría",
    });
  }
}
