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

export async function desactivarUsuario(id, token) {
  const respuesta = await fetch(
    `${API_URL}/admin/${id}/desactivar`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  let datos = {};

  try {
    datos = await respuesta.json();
  } catch {
    datos = {};
  }

  if (!respuesta.ok) {
    const mensajes = {
      400: "El ID del usuario no es válido",
      401: "Tu sesión no es válida o ha expirado",
      403: "No tienes permisos para desactivar esta cuenta",
      404: "El usuario no fue encontrado",
      409: "La cuenta ya se encuentra desactivada",
      500: "Error interno al desactivar la cuenta",
    };

    throw new Error(
      datos.mensaje ||
      mensajes[respuesta.status] ||
      "No se pudo desactivar la cuenta"
    );
  }

  return datos;
}
