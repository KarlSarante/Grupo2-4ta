const API_URL = "http://localhost:3000/api";

export async function obtenerTransacciones(token) {
  let respuesta;
  let datos;

  try {
    respuesta = await fetch(`${API_URL}/transactions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  try {
    datos = await respuesta.json();
  } catch {
    throw new Error("El servidor devolvió una respuesta no válida");
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error("Tu sesión no es válida o ha expirado");
    }

    throw new Error(datos.mensaje || "No se pudo consultar el historial");
  }

  if (!Array.isArray(datos.transacciones)) {
    throw new Error("El servidor no devolvió una lista de transacciones");
  }

  return datos.transacciones;
}

export async function editarTransaccion(id, datos, token) {
  let respuesta;
  let cuerpo;

  try {
    respuesta = await fetch(`${API_URL}/finanzas/transacciones/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  try {
    cuerpo = await respuesta.json();
  } catch {
    throw new Error("El servidor devolvió una respuesta no válida");
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error("Tu sesión no es válida o ha expirado");
    }

    const error = new Error(cuerpo.mensaje || "No se pudo editar la transacción");
    error.errores = cuerpo.errores ?? [];
    throw error;
  }

  return cuerpo.transaccion;
}
