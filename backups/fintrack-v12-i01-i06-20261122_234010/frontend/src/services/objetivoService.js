const API_URL = "http://localhost:3000/api";

function obtenerToken() {
  try {
    return JSON.parse(
      localStorage.getItem("sesion") ||
      sessionStorage.getItem("sesion") ||
      "null"
    )?.token;
  } catch {
    return null;
  }
}

async function solicitar(ruta, opciones = {}) {
  const token = obtenerToken();
  if (!token) throw new Error("Tu sesión ha expirado.");

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...opciones.headers,
      },
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    throw new Error("El servidor devolvió una respuesta no válida.");
  }

  if (!respuesta.ok) {
    const error = new Error(
      datos?.mensaje || "No se pudo completar la solicitud."
    );

    error.status = respuesta.status;
    error.errores = Array.isArray(datos?.errores)
      ? datos.errores
      : [];

    throw error;
  }

  return datos;
}

export function crearObjetivo(objetivo) {
  return solicitar("/finanzas/objetivos", {
    method: "POST",
    body: JSON.stringify(objetivo),
  });
}

export function obtenerObjetivos() {
  return solicitar("/finanzas/objetivos");
}

export function agregarAportacion(objetivoId, monto) {
  return solicitar(`/finanzas/objetivos/${objetivoId}/aportaciones`, {
    method: "POST",
    body: JSON.stringify({ monto }),
  });
}

export function actualizarObjetivo(objetivoId, datos) {
  return solicitar(`/finanzas/objetivos/${objetivoId}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}