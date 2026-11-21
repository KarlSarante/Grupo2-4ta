import { useEffect, useRef, useState } from "react";
import { obtenerObjetivos } from "../services/objetivoService.js";
import NuevaMetaForm from "./NuevaMetaForm.jsx";
import AportacionMetaForm from "./AportacionMetaForm.jsx";
import "./MetasFinancierasPanel.css";

function formatoMoneda(valor) {
  return `RD$ ${Number(valor || 0).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function extraerObjetivos(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.objetivos)) return respuesta.objetivos;
  if (Array.isArray(respuesta?.metas)) return respuesta.metas;
  if (Array.isArray(respuesta?.data?.objetivos)) return respuesta.data.objetivos;
  throw new Error("El servidor devolvió un formato de metas no reconocido.");
}

export default function MetasFinancierasPanel() {
  const [metas, setMetas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardandoMeta, setGuardandoMeta] = useState(false);
  const dialogoRef = useRef(null);
  const botonAbrirRef = useRef(null);
  const [modalAportacionAbierto, setModalAportacionAbierto] = useState(false);
  const [guardandoAportacion, setGuardandoAportacion] = useState(false);
  const dialogoAportacionRef = useRef(null);
  const botonAportarRef = useRef(null);
  const [avisoAportacion, setAvisoAportacion] = useState("");

  function abrirAportacion() {
    if (!meta || meta.estado !== "activo" || completada) return;
    setAvisoAportacion("");
    setModalAportacionAbierto(true);
  }

  function cerrarAportacion() {
    if (guardandoAportacion) return;
    dialogoAportacionRef.current?.close();
    setModalAportacionAbierto(false);
    botonAportarRef.current?.focus();
  }

  useEffect(() => {
    if (
      modalAportacionAbierto &&
      dialogoAportacionRef.current &&
      !dialogoAportacionRef.current.open
    ) {
      dialogoAportacionRef.current.showModal();
    }
  }, [modalAportacionAbierto]);

  async function aportacionRegistrada(actualizada) {
    dialogoAportacionRef.current?.close();
    setModalAportacionAbierto(false);
    botonAportarRef.current?.focus();

    // Mostrar inmediatamente el resultado confirmado por el POST.
    setMetas((anteriores) =>
      anteriores.map((item) =>
        String(item.id) === String(actualizada.id) ? actualizada : item
      )
    );
    setAvisoAportacion("Aportación registrada correctamente.");

    // Reconciliar con la lista del servidor, que puede reordenarse.
    try {
      const respuesta = await obtenerObjetivos();
      const lista = extraerObjetivos(respuesta);
      const posicion = lista.findIndex(
        (item) => String(item.id) === String(actualizada.id)
      );
      setMetas(lista);
      if (posicion >= 0) setIndice(posicion);
    } catch {
      setAvisoAportacion(
        "Aportación registrada. No se pudo refrescar la lista, " +
        "pero se conserva el resultado confirmado por el servidor."
      );
    }
  }

  function abrirModal() {
    if (modalAbierto) return;
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardandoMeta) return;
    dialogoRef.current?.close();
    setModalAbierto(false);
    botonAbrirRef.current?.focus();
  }

  useEffect(() => {
    if (modalAbierto && dialogoRef.current && !dialogoRef.current.open) {
      dialogoRef.current.showModal();
    }
  }, [modalAbierto]);

  async function metaCreada(objetivoCreado) {
    dialogoRef.current?.close();
    setModalAbierto(false);
    botonAbrirRef.current?.focus();

    try {
      const respuesta = await obtenerObjetivos();
      const actualizadas = extraerObjetivos(respuesta);
      setMetas(actualizadas);

      const posicion = actualizadas.findIndex(
        (meta) => String(meta.id) === String(objetivoCreado.id)
      );

      setIndice(posicion >= 0 ? posicion : 0);
      setError("");
    } catch (err) {
      setError(
        "La meta fue creada, pero no se pudo actualizar la lista. " +
        (err?.message || "")
      );
    }
  }

  useEffect(() => {
    let activo = true;

    async function cargarMetas() {
      setCargando(true);
      setError("");

      try {
        const respuesta = await obtenerObjetivos();
        if (activo) {
          setMetas(extraerObjetivos(respuesta));
          setIndice(0);
        }
      } catch (err) {
        if (activo) {
          setError(err?.message || "No se pudieron cargar las metas.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarMetas();
    return () => { activo = false; };
  }, []);

  const meta = metas[indice];
  const actual = Number(meta?.monto_actual ?? 0);
  const objetivo = Number(meta?.monto_objetivo ?? 0);
  const porcentaje = objetivo > 0 ? (actual / objetivo) * 100 : 0;
  const progreso = Math.max(0, Math.min(100, porcentaje));
  const completada = objetivo > 0 && actual >= objetivo;

  return (
    <section className="admin-seccion fintrack-metas" aria-label="Meta financiera">
      <header className="fintrack-metas-cabecera">
        <div>
          <h2>Mis metas financieras</h2>
          <p>Consulta el progreso de tus objetivos de ahorro.</p>
        </div>
        <button
          ref={botonAbrirRef}
          type="button"
          onClick={abrirModal}
        >
          + Nueva meta
        </button>
      </header>

      {cargando && <p role="status">Cargando metas financieras...</p>}

      {!cargando && error && (
        <p className="fintrack-metas-error" role="alert">{error}</p>
      )}

      {!cargando && !error && metas.length === 0 && (
        <div className="fintrack-metas-vacia">
          Todavía no tienes metas financieras registradas.
        </div>
      )}

      {!cargando && !error && meta && (
        <article className="fintrack-meta-tarjeta">
          <div className="fintrack-meta-titulo">
            <h3>{meta.nombre}</h3>
            <span>{completada ? "Completada" : "Activa"}</span>
          </div>

          <strong className="fintrack-meta-monto">
            {formatoMoneda(actual)}
          </strong>

          <p>de {formatoMoneda(objetivo)}</p>

          <div
            className="fintrack-meta-barra"
            role="progressbar"
            aria-label={`Progreso de ${meta.nombre}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progreso)}
          >
            <div style={{ width: `${progreso}%` }} />
          </div>

          <div className="fintrack-meta-detalles">
            <strong>
              {porcentaje.toLocaleString("es-DO", {
                maximumFractionDigits: 1
              })}% alcanzado
            </strong>

            <span>
              {completada && actual > objetivo
                ? `Excedente: ${formatoMoneda(actual - objetivo)}`
                : `Restante: ${formatoMoneda(Math.max(0, objetivo - actual))}`}
            </span>
          </div>

          {meta.fecha_limite && (
            <p>Fecha límite: {String(meta.fecha_limite).slice(0, 10)}</p>
          )}

          <nav className="fintrack-meta-navegacion" aria-label="Navegación entre metas">
            <button
              type="button"
              disabled={indice === 0}
              onClick={() => setIndice(i => Math.max(0, i - 1))}
            >
              ← Anterior
            </button>

            <span aria-live="polite">
              {indice + 1} de {metas.length}
            </span>

            <button
              type="button"
              disabled={indice >= metas.length - 1}
              onClick={() => setIndice(i => Math.min(metas.length - 1, i + 1))}
            >
              Siguiente →
            </button>
          </nav>

          <button
            ref={botonAportarRef}
            type="button"
            className="fintrack-meta-aportar"
            disabled={completada || meta.estado !== "activo"}
            title={
              completada || meta.estado !== "activo"
                ? "Esta meta no admite nuevas aportaciones"
                : "Registrar aportación"
            }
            onClick={abrirAportacion}
          >
            {completada ? "Meta completada" : "+ Aportar"}
          </button>
        </article>
      )}

      {avisoAportacion && (
        <p className="fintrack-aportacion-estado" role="status">
          {avisoAportacion}
        </p>
      )}

      {modalAportacionAbierto && meta && (
        <dialog
          ref={dialogoAportacionRef}
          className="fintrack-modal-meta fintrack-modal-aportacion"
          aria-labelledby="fintrack-aportacion-titulo"
          onCancel={(evento) => {
            evento.preventDefault();
            cerrarAportacion();
          }}
          onClose={() => {
            setModalAportacionAbierto(false);
            botonAportarRef.current?.focus();
          }}
        >
          <button
            type="button"
            className="fintrack-modal-meta-cerrar"
            aria-label="Cerrar formulario de aportación"
            onClick={cerrarAportacion}
            disabled={guardandoAportacion}
          >
            ×
          </button>
          <AportacionMetaForm
            meta={meta}
            onCancelar={cerrarAportacion}
            onRegistrada={aportacionRegistrada}
            onEstadoGuardando={setGuardandoAportacion}
          />
        </dialog>
      )}

      {modalAbierto && (
        <dialog
          ref={dialogoRef}
          className="fintrack-modal-meta"
          aria-labelledby="fintrack-nueva-meta-titulo"
          onCancel={(evento) => {
            evento.preventDefault();
            cerrarModal();
          }}
          onClose={() => {
            setModalAbierto(false);
            botonAbrirRef.current?.focus();
          }}
        >
          <button
            type="button"
            className="fintrack-modal-meta-cerrar"
            aria-label="Cerrar formulario"
            onClick={cerrarModal}
            disabled={guardandoMeta}
          >
            ×
          </button>
          <NuevaMetaForm
            onCancelar={cerrarModal}
            onCreada={metaCreada}
            onEstadoGuardando={setGuardandoMeta}
          />
        </dialog>
      )}
    </section>
  );
}