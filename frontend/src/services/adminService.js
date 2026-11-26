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

export async function reactivarUsuario(id, token) {
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
    throw new Error("El ID del usuario no es válido");
  }

  let respuesta;

  try {
    respuesta = await fetch(
      `${API_URL}/admin/${Number(id)}/reactivar`,
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

  let datos = {};
  try {
    datos = await respuesta.json();
  } catch {
    // El estado HTTP sigue permitiendo mostrar un error útil si el cuerpo no es JSON.
  }

  if (!respuesta.ok) {
    const mensajes = {
      400: "El ID del usuario no es válido",
      401: "Tu sesión no es válida o ha expirado",
      403: "No tienes permisos para reactivar esta cuenta",
      404: "El usuario no fue encontrado",
      409: "La cuenta ya se encuentra activa",
      500: "Error interno al reactivar la cuenta",
    };

    throw new Error(
      datos.mensaje ||
      mensajes[respuesta.status] ||
      "No se pudo reactivar la cuenta"
    );
  }

  return datos;
}
