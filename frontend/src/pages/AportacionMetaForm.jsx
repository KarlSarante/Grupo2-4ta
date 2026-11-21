import { useRef, useState } from "react";
import { z } from "zod";
import { agregarAportacion } from "../services/objetivoService.js";

const esquema = z.object({
  monto: z.number()
    .finite("Introduce un monto válido.")
    .positive("La aportación debe ser mayor que cero.")
    .max(9999999999.99, "El monto supera el máximo permitido."),
});

function convertirMonto(valor) {
  const texto = String(valor ?? "").trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) {
    return NaN;
  }

  return Number(texto);
}

export default function AportacionMetaForm({
  meta,
  onCancelar,
  onRegistrada,
  onEstadoGuardando,
}) {
  const [monto, setMonto] = useState("");
  const [errorMonto, setErrorMonto] = useState("");
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const bloqueo = useRef(false);

  async function guardar(evento) {
    evento.preventDefault();

    if (bloqueo.current) return;

    const valor = convertirMonto(monto);
    const resultado = esquema.safeParse({ monto: valor });

    if (!resultado.success || !Number.isFinite(valor)) {
      setErrorMonto(
        Number.isFinite(valor)
          ? resultado.error.issues[0]?.message
          : "Introduce un monto válido con hasta dos decimales."
      );
      return;
    }

    bloqueo.current = true;
    setGuardando(true);
    onEstadoGuardando(true);
    setErrorMonto("");
    setErrorGeneral("");

    let objetivoActualizado;

    try {
      const respuesta = await agregarAportacion(meta.id, valor);
      objetivoActualizado = respuesta?.objetivo;

      if (!objetivoActualizado || objetivoActualizado.id == null) {
        // El POST puede haberse registrado: no permitir repetirlo.
        setErrorGeneral(
          "El servidor respondió, pero no confirmó la meta actualizada. " +
          "Revisa el progreso antes de intentar otra aportación."
        );
        setGuardando(false);
        onEstadoGuardando(false);
        return;
      }
    } catch (error) {
      // Ante un error de red el resultado puede ser incierto.
      // No liberar el bloqueo hasta cerrar y volver a abrir.
      setErrorGeneral(
        (error?.message || "No se pudo confirmar la aportación.") +
        " Comprueba el saldo antes de volver a intentarlo."
      );
      setGuardando(false);
      onEstadoGuardando(false);
      return;
    }

    onEstadoGuardando(false);
    onRegistrada(objetivoActualizado);
  }

  return (
    <form
      className="fintrack-nueva-meta-form"
      onSubmit={guardar}
      noValidate
    >
      <h2 id="fintrack-aportacion-titulo">
        Registrar aportación
      </h2>

      <div className="fintrack-nueva-meta-campo">
        <label htmlFor="aportacion-meta-nombre">
          Meta financiera
        </label>
        <input
          id="aportacion-meta-nombre"
          type="text"
          value={meta.nombre}
          readOnly
          tabIndex={-1}
          aria-readonly="true"
        />
      </div>

      <div className="fintrack-nueva-meta-campo">
        <label htmlFor="aportacion-monto">
          Monto de la aportación (RD$) *
        </label>
        <input
          id="aportacion-monto"
          name="monto"
          type="text"
          inputMode="decimal"
          autoFocus
          value={monto}
          onChange={(evento) => {
            setMonto(evento.target.value);
            setErrorMonto("");
          }}
          placeholder="0.00"
          disabled={guardando || bloqueo.current}
          aria-invalid={Boolean(errorMonto)}
          aria-describedby={
            errorMonto ? "aportacion-monto-error" : undefined
          }
        />
        {errorMonto && (
          <p
            id="aportacion-monto-error"
            className="fintrack-nueva-meta-error"
            role="alert"
          >
            {errorMonto}
          </p>
        )}
      </div>

      <p className="fintrack-aportacion-aviso">
        Puedes aportar más del monto restante. El excedente
        quedará registrado en la meta financiera.
      </p>

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
          disabled={guardando || bloqueo.current}
        >
          {guardando ? "Registrando..." : "Registrar aportación"}
        </button>
      </div>
    </form>
  );
}