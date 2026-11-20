// Dirección base de la API del backend.
const API_URL = "http://localhost:3000/api";

/**
 * HU-016 / #93: Crear una categoría general.
 *
 * Envía los datos al backend mediante POST /api/categorias.
 *
 * @param {Object} categoria - Nombre y tipo de categoría.
 * @param {string} token - Token JWT del administrador.
 * @returns {Promise<Object>} Datos devueltos por la API.
 */
export async function crearCategoria(categoria, token) {
  let respuesta;

  // Maneja exclusivamente los errores de conexión.
  try {
    respuesta = await fetch(`${API_URL}/categorias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoria),
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Inténtalo nuevamente."
    );
  }

  // Procesa la respuesta del backend.
  const datos = await respuesta.json();

  // Conserva los errores HTTP enviados por la API.
  // Ejemplos: 400 (validación), 403 (permisos), 409 (duplicado).
  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || "No se pudo crear la categoría"
    );
  }

  // Devuelve los datos cuando la categoría se crea correctamente.
  return datos;
}

/**
 * HU-016: Obtener categorías generales.
 *
 * GET /api/categorias
 *
 * Recupera las categorías registradas en MySQL.
 *
 * @param {string} token - JWT del administrador.
 * @returns {Promise<Array>} Listado de categorías.
 */
export async function obtenerCategorias(token, tipo = null) {
  let respuesta;

  // Realizar la solicitud autenticada al backend.
  try {
    respuesta = await fetch(
      `${API_URL}/categorias${tipo ? `?tipo=${encodeURIComponent(tipo)}` : ""}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Inténtalo nuevamente."
    );
  }

  // Procesar la respuesta de la API.
  const datos = await respuesta.json();

  // Conservar los mensajes de error del backend.
  if (!respuesta.ok) {
    const error = new Error(
      datos.mensaje || "No se pudieron consultar las categorías"
    );

    error.estado = respuesta.status;
    error.errores = datos.errores ?? [];

    throw error;
  }

  // Garantizar que el componente reciba un listado válido.
  if (!Array.isArray(datos.categorias)) {
    throw new Error("La respuesta de categorías no es válida");
  }

  return datos.categorias;
}