const API_URL = "http://localhost:3000/api/budget-limit";

async function solicitarLimite(metodo, monto, token) {

  if (!token) {
    throw new Error("No hay una sesión activa");
  }

  const opciones = {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  if (metodo === "PUT") {
    opciones.headers["Content-Type"] = "application/json";
    opciones.body = JSON.stringify({ monto });
  }

  let respuesta;

  try {
    respuesta = await fetch(API_URL, opciones);
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  let datos;

  try {
    datos = await respuesta.json();
  } catch {
    throw new Error("El servidor devolvió una respuesta inválida");
  }

  if (!respuesta.ok) {
    throw new Error(
      datos?.mensaje ||
      datos?.error ||
      "No se pudo procesar la solicitud"
    );
  }

  return datos.limite;
}

export async function consultarLimiteGastos(token) {
  return solicitarLimite("GET", undefined, token);
}

export async function actualizarLimiteGastos(monto, token) {
  return solicitarLimite("PUT", monto, token);
}