const API_URL = "http://localhost:3000/api";

export async function iniciarSesion(credenciales) {
  const respuesta = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credenciales),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || "No se pudo iniciar sesión");
  }

  return datos;
}

export function cerrarSesion() {
  localStorage.removeItem("sesion");
}

export async function registrarUsuario(usuario) {
  const respuesta = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(usuario),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || "No se pudo registrar el usuario");
  }

  return datos;
}