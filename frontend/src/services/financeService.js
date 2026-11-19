const API_URL = "http://localhost:3000/api";

export async function obtenerTransacciones(token) {
  const respuesta = await fetch(`${API_URL}/transactions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error("Tu sesión no es válida o ha expirado");
    }

    throw new Error(datos.mensaje || "No se pudo consultar el historial");
  }

  return datos.transacciones;
}
