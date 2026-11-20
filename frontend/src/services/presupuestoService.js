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
    throw new Error(datos.mensaje || "No se pudo completar la solicitud.");
  }
  return datos;
}

export function guardarPresupuesto(presupuesto) {
  return solicitar("/finanzas/presupuestos", {
    method: "POST",
    body: JSON.stringify(presupuesto),
  });
}

export function obtenerPresupuestos(mes) {
  return solicitar(`/finanzas/presupuestos?mes=${encodeURIComponent(mes)}`);
}

export function obtenerNotificaciones() {
  return solicitar("/finanzas/notificaciones");
}
