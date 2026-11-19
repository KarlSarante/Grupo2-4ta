const API_URL = "http://localhost:3000/api";

/**
 * HU004 / #66: Registrar un ingreso.
 *
 * POST /api/finanzas/ingresos
 *
 * @param {Object} ingreso - Datos del ingreso.
 * @param {string} token - JWT del usuario autenticado.
 * @returns {Promise<Object>} Respuesta del backend.
 */
export async function registrarIngreso(ingreso, token) {
  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}/finanzas/ingresos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ingreso),
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Inténtalo nuevamente."
    );
  }

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(
      datos.mensaje || "No se pudo registrar el ingreso"
    );

    // Conservar los errores de validación enviados por Zod.
    error.errores = Array.isArray(datos.errores)
      ? datos.errores
      : [];

    throw error;
  }

  return datos;
}

/**
 * HU004 / #66: Consultar los ingresos del usuario autenticado.
 *
 * GET /api/finanzas/ingresos
 *
 * @param {string} token - JWT del usuario autenticado.
 * @returns {Promise<Array>} Ingresos registrados.
 */
export async function obtenerIngresos(token) {
  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}/finanzas/ingresos`, {
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

  let datos;

  try {
    datos = await respuesta.json();
  } catch {
    throw new Error("El servidor devolvió una respuesta inválida.");
  }

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || "No se pudieron consultar los ingresos."
    );
  }

  if (!Array.isArray(datos.ingresos)) {
    throw new Error(
      "El servidor devolvió una lista de ingresos inválida."
    );
  }

  return datos.ingresos;
}
