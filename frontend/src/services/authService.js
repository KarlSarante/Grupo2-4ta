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

function leerToken() {
  try {
    return JSON.parse(localStorage.getItem("sesion"))?.token ?? null;
  } catch {
    return null;
  }
}

// Cierra la sesión y devuelve el mensaje de confirmación del backend
// (o null si el servidor no respondió).
export async function cerrarSesion() {
  // 1) Leer el token ANTES de borrarlo, para poder avisar al backend
  const token = leerToken();

  // 2) Eliminar la sesión (token + usuario) del navegador.
  //    Esto ocurre al instante, antes de esperar al servidor.
  for (const storage of [localStorage, sessionStorage]) {
    try {
      storage.removeItem("sesion");
    } catch {
      // storage bloqueado por el navegador: se ignora
    }
  }

  // 3) Pedir confirmación al backend (máximo 3 segundos de espera).
  //    Si falla, la sesión ya quedó cerrada en el cliente.
  if (!token) return null;
  try {
    const respuesta = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!respuesta.ok) return null;
    const datos = await respuesta.json();
    return datos.mensaje ?? null;
  } catch {
    return null;
  }
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