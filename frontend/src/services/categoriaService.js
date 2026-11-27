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
 * Actualiza una categoría personal del usuario autenticado.
 *
 * PUT /api/categorias/:id
 *
 * @param {number} id - ID de la categoría personal.
 * @param {Object} categoria - Nombre y tipo actualizados.
 * @param {string} token - Token JWT del usuario.
 * @returns {Promise<Object>} Respuesta de la API.
 */
export async function actualizarCategoriaPersonal(id, categoria, token) {
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    throw new Error("ID de categoría inválido");
  }

  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}/categorias/${id}`, {
      method: "PUT",
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

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(
      datos.mensaje || "No se pudo actualizar la categoría"
    );

    error.estado = respuesta.status;
    error.errores = datos.errores ?? [];

    throw error;
  }

  return datos;
}

/**
 * Actualiza una categoría general desde el panel administrativo.
 *
 * PUT /api/categorias/:id
 *
 * @param {number} id - ID de la categoría general.
 * @param {Object} categoria - Nombre y tipo actualizados.
 * @param {string} token - Token JWT del administrador.
 * @returns {Promise<Object>} Respuesta de la API.
 */
export async function actualizarCategoriaGeneral(id, categoria, token) {
  const idNumerico = Number(id);
  if (
    !Number.isSafeInteger(idNumerico) ||
    idNumerico < 1 ||
    idNumerico > 2147483647
  ) {
    throw new Error("ID de categoría inválido");
  }

  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}/categorias/${idNumerico}`, {
      method: "PUT",
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

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(
      datos.mensaje || "No se pudo actualizar la categoría"
    );

    error.estado = respuesta.status;
    error.errores = datos.errores ?? [];

    throw error;
  }

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
export async function obtenerCategorias(
  token,
  tipo = null,
  incluirInactivas = false
) {
  let respuesta;
  const parametros = new URLSearchParams();
  if (tipo) parametros.set("tipo", tipo);
  if (incluirInactivas) parametros.set("incluir_inactivas", "true");
  const query = parametros.toString();

  // Realizar la solicitud autenticada al backend.
  try {
    respuesta = await fetch(
      `${API_URL}/categorias${query ? `?${query}` : ""}`,
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

/**
 * Reactiva una categoría personal inactiva del usuario autenticado.
 *
 * PATCH /api/categorias/:id/reactivar
 *
 * @param {number} id - ID de la categoría personal.
 * @param {string} token - Token JWT del usuario.
 * @returns {Promise<Object>} Respuesta de la API.
 */
export async function reactivarCategoriaPersonal(id, token) {
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    throw new Error("ID de categoría inválido");
  }

  let respuesta;

  try {
    respuesta = await fetch(
      `${API_URL}/categorias/${id}/reactivar`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Inténtalo nuevamente."
    );
  }

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(
      datos.mensaje || "No se pudo reactivar la categoría"
    );

    error.estado = respuesta.status;
    error.errores = datos.errores ?? [];

    throw error;
  }

  return datos;
}

/**
 * Desactiva una categoría según los permisos del usuario autenticado.
 *
 * PATCH /api/categorias/:id/desactivar
 *
 * @param {number} id - ID de la categoría.
 * @param {string} token - Token JWT del usuario.
 * @returns {Promise<Object>} Respuesta de la API.
 */
export async function desactivarCategoria(id, token) {
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    throw new Error("ID de categoría inválido");
  }

  let respuesta;

  try {
    respuesta = await fetch(
      `${API_URL}/categorias/${id}/desactivar`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Inténtalo nuevamente."
    );
  }

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(
      datos.mensaje || "No se pudo desactivar la categoría"
    );

    error.estado = respuesta.status;
    error.errores = datos.errores ?? [];

    throw error;
  }

  return datos;
}
