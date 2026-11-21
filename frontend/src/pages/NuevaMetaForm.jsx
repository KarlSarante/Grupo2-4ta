import { useRef, useState } from "react";
import { z } from "zod";
import { crearObjetivo } from "../services/objetivoService.js";

const MAXIMO = 9999999999.99;

function convertirMonto(valor) {
  const texto = String(valor ?? "").trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) {
    return NaN;
  }

  return Number(texto);
}

const esquema = z.object({
  nombre: z.string().trim().min(2, "Escribe al menos 2 caracteres.")
    .max(100, "El nombre no puede superar 100 caracteres."),
  monto_objetivo: z.number()
    .finite("Introduce un monto objetivo válido.")
    .positive("El objetivo debe ser mayor que cero.")
    .max(MAXIMO, "El monto supera el máximo permitido."),
  monto_actual: z.number()
    .finite("Introduce un monto inicial válido.")
    .min(0, "El monto inicial no puede ser negativo.")
    .max(MAXIMO, "El monto supera el máximo permitido."),
  fecha_limite: z.string().nullable(),
}).refine(
  (datos) => datos.monto_actual <= datos.monto_objetivo,
  {
    path: ["monto_actual"],
    message: "El monto inicial no puede superar el objetivo.",
  }
);

const inicial = {
  nombre: "",
  monto_objetivo: "",
  monto_actual: "0",
  fecha_limite: "",
};

export default function NuevaMetaForm({ onCancelar, onCreada, onEstadoGuardando }) {
  const [valores, setValores] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const bloqueo = useRef(false);

  function cambiar(campo, valor) {
    setValores((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anterior) => ({ ...anterior, [campo]: "" }));
    setErrorGeneral("");
  }

  async function guardar(evento) {
    evento.preventDefault();

    if (bloqueo.current) return;

    const objetivo = convertirMonto(valores.monto_objetivo);
    const actual = convertirMonto(valores.monto_actual || "0");
    const fecha = valores.fecha_limite.trim();

    const nuevosErrores = {};

    if (!Number.isFinite(objetivo)) {
      nuevosErrores.monto_objetivo =
        "Introduce un monto válido con hasta dos decimales.";
    }

    if (!Number.isFinite(actual)) {
      nuevosErrores.monto_actual =
        "Introduce un monto válido con hasta dos decimales.";
    }

    if (fecha) {
      const fechaValida =
        /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
        !Number.isNaN(Date.parse(`${fecha}T00:00:00Z`)) &&
        new Date(`${fecha}T00:00:00Z`)
          .toISOString().slice(0, 10) === fecha;

      if (!fechaValida) {
        nuevosErrores.fecha_limite = "Introduce una fecha válida.";
      }
    }

    const datos = {
      nombre: valores.nombre.trim(),
      monto_objetivo: objetivo,
      monto_actual: actual,
      fecha_limite: fecha || null,
    };

    const validacion = esquema.safeParse(datos);

    if (!validacion.success) {
      for (const problema of validacion.error.issues) {
        const campo = problema.path[0];
        if (campo && !nuevosErrores[campo]) {
          nuevosErrores[campo] = problema.message;
        }
      }
    }

    if (Object.keys(nuevosErrores).length) {
      setErrores(nuevosErrores);
      return;
    }

    bloqueo.current = true;
    setGuardando(true);
    onEstadoGuardando(true);
    setErrorGeneral("");

    let creada;

    try {
      const respuesta = await crearObjetivo(validacion.data);
      creada = respuesta?.objetivo;

      if (!creada || creada.id == null) {
        throw new Error(
          "El servidor no confirmó el identificador de la meta."
        );
      }
    } catch (error) {
      setErrorGeneral(
        error?.message || "No se pudo crear la meta financiera."
      );
      bloqueo.current = false;
      setGuardando(false);
      onEstadoGuardando(false);
      return;
    }

    // La creación ya fue confirmada: no repetir el POST.
    // La actualización de la lista se gestiona por separado.
    onEstadoGuardando(false);
    onCreada(creada);
  }

  return (
    <form className="fintrack-nueva-meta-form" onSubmit={guardar} noValidate>
      <h2 id="fintrack-nueva-meta-titulo">Nueva meta financiera</h2>

      <div className="fintrack-nueva-meta-campo">
        <label htmlFor="meta-nombre">Nombre de la meta *</label>
        <input
          id="meta-nombre"
          name="nombre"
          autoFocus
          maxLength={100}
          value={valores.nombre}
          onChange={(e) => cambiar("nombre", e.target.value)}
          placeholder="Ej. Fondo de emergencia"
          disabled={guardando}
          aria-invalid={Boolean(errores.nombre)}
          aria-describedby={errores.nombre ? "meta-nombre-error" : undefined}
        />
        {errores.nombre && (
          <p id="meta-nombre-error" className="fintrack-nueva-meta-error">
            {errores.nombre}
          </p>
        )}
      </div>

      <div className="fintrack-nueva-meta-campo">
        <label htmlFor="meta-objetivo">Monto objetivo (RD$) *</label>
        <input
          id="meta-objetivo"
          name="monto_objetivo"
          type="text"
          inputMode="decimal"
          value={valores.monto_objetivo}
          onChange={(e) => cambiar("monto_objetivo", e.target.value)}
          placeholder="10000.00"
          disabled={guardando}
          aria-invalid={Boolean(errores.monto_objetivo)}
        />
        {errores.monto_objetivo && (
          <p className="fintrack-nueva-meta-error">
            {errores.monto_objetivo}
          </p>
        )}
      </div>

      <div className="fintrack-nueva-meta-campo">
        <label htmlFor="meta-inicial">Monto inicial (RD$)</label>
        <input
          id="meta-inicial"
          name="monto_actual"
          type="text"
          inputMode="decimal"
          value={valores.monto_actual}
          onChange={(e) => cambiar("monto_actual", e.target.value)}
          disabled={guardando}
          aria-invalid={Boolean(errores.monto_actual)}
        />
        {errores.monto_actual && (
          <p className="fintrack-nueva-meta-error">
            {errores.monto_actual}
          </p>
        )}
      </div>

      <div className="fintrack-nueva-meta-campo">
        <label htmlFor="meta-fecha">Fecha límite (opcional)</label>
        <input
          id="meta-fecha"
          name="fecha_limite"
          type="date"
          value={valores.fecha_limite}
          onChange={(e) => cambiar("fecha_limite", e.target.value)}
          disabled={guardando}
          aria-invalid={Boolean(errores.fecha_limite)}
        />
        {errores.fecha_limite && (
          <p className="fintrack-nueva-meta-error">
            {errores.fecha_limite}
          </p>
        )}
      </div>

      {errorGeneral && (
        <p className="fintrack-nueva-meta-error" role="alert">
          {errorGeneral}
        </p>
      )}

      <div className="fintrack-nueva-meta-acciones">
        <button
          type="button"
          className="fintrack-nueva-meta-cancelar"
          onClick={onCancelar}
          disabled={guardando}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="fintrack-nueva-meta-guardar"
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Guardar meta"}
        </button>
      </div>
    </form>
  );
}