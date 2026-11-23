const API_URL = "http://localhost:3000/api";

export async function obtenerUsuarios(token) {
  const respuesta = await fetch(`${API_URL}/admin/usuarios`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error("Tu sesión no es válida o ha expirado");
    }

    if (respuesta.status === 403) {
      throw new Error("No tienes permisos para consultar usuarios");
    }

    throw new Error("No se pudo obtener la lista de usuarios");
  }

  const datos = await respuesta.json();

  return datos.usuarios;
}
