// HU-005 / #75: Conectar con API de gastos
// Misma URL base que authService.js
const API_URL = "http://localhost:3000/api";

// Error con el estado HTTP y, si el servidor los envió, los errores por campo.
export class ErrorApi extends Error {
  constructor(mensaje, { estado = 0, errores = [] } = {}) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estado = estado;
    this.errores = errores;
  }
}

// La sesión se guarda en localStorage con la clave "sesion" (ver App.jsx).
function obtenerToken() {
  try {
    return JSON.parse(localStorage.getItem("sesion"))?.token ?? null;
  } catch {
    return null;
  }
}

// Lee el cuerpo JSON de la respuesta; devuelve null si no hay cuerpo o no es JSON.
async function leerJson(respuesta) {
  try {
    return await respuesta.json();
  } catch {
    return null;
  }
}

// POST /api/finanzas/gastos
// datos: { categoria_id, monto, fecha, descripcion }
// Devuelve { mensaje, gasto } si se registró; lanza ErrorApi en cualquier otro caso.
export async function registrarGasto(datos) {
  const token = obtenerToken();

  if (!token) {
    throw new ErrorApi("Tu sesión ha expirado. Inicia sesión nuevamente.", {
      estado: 401,
    });
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/finanzas/gastos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });
  } catch {
    throw new ErrorApi(
      "No se pudo conectar con el servidor. Intenta nuevamente."
    );
  }

  const cuerpo = await leerJson(respuesta);

  if (!respuesta.ok) {
    const mensaje =
      respuesta.status === 401
        ? "Tu sesión ha expirado. Inicia sesión nuevamente."
        : cuerpo?.mensaje || "No se pudo registrar el gasto";

    throw new ErrorApi(mensaje, {
      estado: respuesta.status,
      errores: cuerpo?.errores ?? [],
    });
  }

  return cuerpo;
}

