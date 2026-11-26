import { useEffect, useMemo, useRef, useState } from "react";
import { obtenerCategorias } from "../services/categoriaService.js";
import {
  obtenerPresupuestos,
  guardarPresupuesto,
  eliminarPresupuesto,
} from "../services/presupuestoService.js";
import "./PresupuestosPanel.css";

const MAX_MONTO = 9999999999.99;

function mesLocal() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

function formatoMes(mes) {
  const [anio, numeroMes] = String(mes).split("-").map(Number);
  if (!anio || !numeroMes) return mes;

  return new Intl.DateTimeFormat("es-DO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, numeroMes - 1, 1)));
}

function formatoDinero(valor) {
  const numero = Number(valor);
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
}

function porcentajeConsumo(gastado, limite) {
  if (!Number.isFinite(limite) || limite <= 0) return 0;
  return (gastado / limite) * 100;
}

function estadoPresupuesto(porcentaje, medio, alto) {
  if (porcentaje >= 100) {
    return { clase: "excedido", texto: "Límite alcanzado" };
  }
  if (porcentaje >= alto) {
    return { clase: "alto", texto: "Alerta alta" };
  }
  if (porcentaje >= medio) {
    return { clase: "medio", texto: "Advertencia" };
  }
  return { clase: "normal", texto: "Dentro del límite" };
}

function datosIniciales(mes) {
  return {
    categoria_id: "",
    mes,
    monto_limite: "",
    umbral_medio: "50",
    umbral_alto: "80",
  };
}

function validarFormulario(formulario) {
  const errores = {};

  const categoria = Number(formulario.categoria_id);
  const montoTexto = String(formulario.monto_limite).trim();
  const monto = Number(montoTexto);
  const medio = Number(formulario.umbral_medio);
  const alto = Number(formulario.umbral_alto);

  if (!Number.isSafeInteger(categoria) || categoria <= 0) {
    errores.categoria_id = "Selecciona una categoría de gasto.";
  }

  if (!/^\d+(\.\d{1,2})?$/.test(montoTexto) ||
      !Number.isFinite(monto) ||
      monto <= 0 ||
      monto > MAX_MONTO) {
    errores.monto_limite =
      "Introduce un monto positivo con hasta dos decimales.";
  }

  if (!Number.isInteger(medio) || medio < 1 || medio > 99) {
    errores.umbral_medio = "Debe estar entre 1 y 99.";
  }

  if (!Number.isInteger(alto) || alto < 2 || alto > 100 ||
      (Number.isInteger(medio) && alto <= medio)) {
    errores.umbral_alto =
      "Debe ser mayor que el umbral medio y no superar 100.";
  }

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(formulario.mes)) {
    errores.mes = "Selecciona un mes válido.";
  }

  return errores;
}

export default function PresupuestosPanel({ token, onPresupuestoEliminado }) {
  const [mes, setMes] = useState(mesLocal);
  const [presupuestos, setPresupuestos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [errorConsulta, setErrorConsulta] = useState("");
  const [errorCategorias, setErrorCategorias] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [formularioVisible, setFormularioVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [formulario, setFormulario] = useState(() =>
    datosIniciales(mesLocal())
  );
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [presupuestoAEliminar, setPresupuestoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState("");
  const [recarga, setRecarga] = useState(0);
  const dialogoPresupuestoRef = useRef(null);
  const dialogoEliminacionRef = useRef(null);
  const consultaActual = useRef(0);
  const categoriasActual = useRef(0);
  const guardadoActual = useRef(0);
  const eliminacionActual = useRef(0);
  const eliminacionEnCurso = useRef(false);
  const mesActualRef = useRef(mes);
  const montado = useRef(true);

  mesActualRef.current = mes;

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      consultaActual.current += 1;
      categoriasActual.current += 1;
      guardadoActual.current += 1;
      eliminacionActual.current += 1;
    };
  }, []);

  useEffect(() => {
    const id = ++consultaActual.current;
    let activo = true;

    setCargando(true);
    setErrorConsulta("");
    setPresupuestos([]);

    async function consultar() {
      try {
        const respuesta = await obtenerPresupuestos(mes);
        if (!activo || id !== consultaActual.current) return;

        if (!respuesta || !Array.isArray(respuesta.presupuestos)) {
          throw new Error("La respuesta de presupuestos no es válida.");
        }

        setPresupuestos(respuesta.presupuestos);
      } catch (error) {
        if (!activo || id !== consultaActual.current) return;
        setErrorConsulta(
          error.message || "No se pudieron consultar los presupuestos."
        );
      } finally {
        if (activo && id === consultaActual.current) {
          setCargando(false);
        }
      }
    }

    consultar();

    return () => {
      activo = false;
    };
  }, [mes, recarga, token]);

  useEffect(() => {
    const id = ++categoriasActual.current;
    let activo = true;

    setCargandoCategorias(true);
    setErrorCategorias("");
    setCategorias([]);

    async function consultar() {
      try {
        const resultado = await obtenerCategorias(token, "gasto");

        if (!activo || id !== categoriasActual.current) return;
        setCategorias(resultado);
      } catch (error) {
        if (!activo || id !== categoriasActual.current) return;
        setErrorCategorias(
          error.message || "No se pudieron cargar las categorías."
        );
      } finally {
        if (activo && id === categoriasActual.current) {
          setCargandoCategorias(false);
        }
      }
    }

    if (token) {
      consultar();
    } else {
      setCargandoCategorias(false);
      setErrorCategorias("No hay una sesión válida.");
    }

    return () => {
      activo = false;
    };
  }, [token]);

const registros = useMemo(
    () => presupuestos.map((p) => {
      const limite = Number(p.monto_limite) || 0;
      const gastado = Number(p.gastado) || 0;
      const porcentaje = porcentajeConsumo(gastado, limite);
      const medio = Number(p.umbral_medio ?? 50);
      const alto = Number(p.umbral_alto ?? 80);

      return {
        ...p,
        limite,
        gastado,
        porcentaje,
        disponible: limite - gastado,
        estado: estadoPresupuesto(porcentaje, medio, alto),
      };
    }),
    [presupuestos]
  );

  const totales = useMemo(
    () => registros.reduce(
      (acc, p) => ({
        limite: acc.limite + p.limite,
        gastado: acc.gastado + p.gastado,
      }),
      { limite: 0, gastado: 0 }
    ),
    [registros]
  );

  const categoriasDisponibles = useMemo(() => {
    const usadas = new Set(
      presupuestos.map((p) => Number(p.categoria_id))
    );
    return categorias.filter((c) => !usadas.has(Number(c.id)));
  }, [categorias, presupuestos]);

  function cambiarMes(evento) {
    const nuevoMes = evento.target.value;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(nuevoMes)) return;

    setMes(nuevoMes);
    setMensaje("");
    setFormularioVisible(false);
    setEditando(false);
    setErrores({});
  }

  function abrirNuevo() {
    setFormulario(datosIniciales(mes));
    setErrores({});
    setMensaje("");
    setEditando(false);
    setFormularioVisible(true);
  }

  function abrirEdicion(p) {
    setFormulario({
      categoria_id: String(p.categoria_id),
      mes: p.mes,
      monto_limite: String(p.monto_limite),
      umbral_medio: String(p.umbral_medio ?? 50),
      umbral_alto: String(p.umbral_alto ?? 80),
    });
    setErrores({});
    setMensaje("");
    setEditando(true);
    setFormularioVisible(true);
  }

  function cancelar() {
    if (guardando) return;
    setFormularioVisible(false);
    setErrores({});
    setEditando(false);
  }

  useEffect(() => {
    const dialogo = dialogoPresupuestoRef.current;
    if (!dialogo || !formularioVisible) return;

    if (!dialogo.open) {
      dialogo.showModal();
    }

    return () => {
      if (dialogo.open) {
        dialogo.close();
      }
    };
  }, [formularioVisible]);

  function solicitarEliminacion(presupuesto) {
    if (eliminando) return;
    setMensaje("");
    setErrorEliminacion("");
    setPresupuestoAEliminar(presupuesto);
  }

  function cancelarEliminacion() {
    if (eliminacionEnCurso.current) return;
    setPresupuestoAEliminar(null);
    setErrorEliminacion("");
  }

  useEffect(() => {
    const dialogo = dialogoEliminacionRef.current;
    if (!dialogo || !presupuestoAEliminar) return;

    if (!dialogo.open) {
      dialogo.showModal();
    }

    return () => {
      if (dialogo.open) {
        dialogo.close();
      }
    };
  }, [presupuestoAEliminar]);

  async function confirmarEliminacion() {
    if (!presupuestoAEliminar || eliminacionEnCurso.current) return;

    const presupuesto = presupuestoAEliminar;
    const id = ++eliminacionActual.current;
    eliminacionEnCurso.current = true;
    setEliminando(true);
    setErrorEliminacion("");

    try {
      await eliminarPresupuesto(presupuesto.id);
      onPresupuestoEliminado?.();

      if (!montado.current || id !== eliminacionActual.current) return;

      setPresupuestos((actuales) =>
        actuales.filter((actual) => String(actual.id) !== String(presupuesto.id))
      );
      setPresupuestoAEliminar(null);
      setMensaje(
        `Presupuesto de ${presupuesto.categoria} eliminado correctamente.`
      );
    } catch (error) {
      if (!montado.current || id !== eliminacionActual.current) return;

      setErrorEliminacion(
        error.message || "No se pudo eliminar el presupuesto."
      );
    } finally {
      eliminacionEnCurso.current = false;
      if (montado.current && id === eliminacionActual.current) {
        setEliminando(false);
      }
    }
  }

  function cambiarCampo(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setErrores((anterior) => ({
      ...anterior,
      [name]: "",
      general: "",
    }));
  }

  async function guardar(evento) {
    evento.preventDefault();

    if (guardando) return;

    const nuevosErrores = validarFormulario(formulario);

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    if (formulario.mes !== mesActualRef.current) {
      setErrores({
        general: "El mes cambió. Vuelve a abrir el formulario.",
      });
      return;
    }

    const id = ++guardadoActual.current;
    const mesGuardado = formulario.mes;

    setGuardando(true);
    setErrores({});

    try {
      await guardarPresupuesto({
        categoria_id: Number(formulario.categoria_id),
        mes: formulario.mes,
        monto_limite: Number(formulario.monto_limite),
        umbral_medio: Number(formulario.umbral_medio),
        umbral_alto: Number(formulario.umbral_alto),
      });

      if (!montado.current || id !== guardadoActual.current) return;

      setFormularioVisible(false);
      setEditando(false);

      if (mesActualRef.current === mesGuardado) {
        setMensaje("Presupuesto guardado correctamente.");
        setRecarga((anterior) => anterior + 1);
      }
    } catch (error) {
      if (!montado.current || id !== guardadoActual.current) return;

      setErrores({
        general: error.message || "No se pudo guardar el presupuesto.",
      });
    } finally {
      if (montado.current && id === guardadoActual.current) {
        setGuardando(false);
      }
    }
  }

  const porcentajeTotal = porcentajeConsumo(
    totales.gastado,
    totales.limite
  );

  return (
    <section className="fintrack-presupuestos-v12" aria-label="Presupuestos">
      <header className="fp-cabecera">
        <div>
          <p>Controla tus límites mensuales por categoría.</p>
        </div>

        <div className="fp-acciones">
          <label className="fp-selector-mes">
            <input
              type="month"
              value={mes}
              onChange={cambiarMes}
              disabled={guardando}
            />
          </label>

          <button
            type="button"
            className="fp-boton fp-boton-primario"
            onClick={abrirNuevo}
            disabled={
              cargando ||
              cargandoCategorias ||
              Boolean(errorConsulta) ||
              Boolean(errorCategorias) ||
              categoriasDisponibles.length === 0 ||
              guardando
            }
          >
            + Nuevo presupuesto
          </button>
        </div>
      </header>

      {mensaje && (
        <p className="fp-mensaje fp-mensaje-exito" role="status">
          {mensaje}
        </p>
      )}

      {errorConsulta && (
        <div className="fp-mensaje fp-mensaje-error" role="alert">
          <p>{errorConsulta}</p>
          <button
            type="button"
            className="fp-boton fp-boton-secundario"
            onClick={() => setRecarga((n) => n + 1)}
          >
            Reintentar
          </button>
        </div>
      )}

      {errorCategorias && (
        <p className="fp-mensaje fp-mensaje-error" role="alert">
          {errorCategorias}
        </p>
      )}

      <div className="fp-resumen">
        <article className="fp-tarjeta">
          <span>Presupuesto total</span>
          <strong>{formatoDinero(totales.limite)}</strong>
        </article>

        <article className="fp-tarjeta">
          <span>Gastos del mes</span>
          <strong>{formatoDinero(totales.gastado)}</strong>
        </article>

        <article className="fp-tarjeta">
          <span>
            {totales.gastado > totales.limite
              ? "Excedente"
              : "Disponible"}
          </span>
          <strong>
            {formatoDinero(
              Math.abs(totales.limite - totales.gastado)
            )}
          </strong>
        </article>
      </div>

      <section className="fp-listado" aria-label="Presupuestos por categoría">
        <div className="fp-listado-cabecera">
          <div>
            <h3>Presupuestos por categoría</h3>
            <p>
              {registros.length}{" "}
              {registros.length === 1 ? "categoría" : "categorías"}
            </p>
          </div>

          {totales.limite > 0 && (
            <strong className="fp-consumo-total">
              {porcentajeTotal.toFixed(1)}% consumido
            </strong>
          )}
        </div>

        {cargando ? (
          <p className="fp-estado" role="status">
            Cargando presupuestos...
          </p>
        ) : !errorConsulta && registros.length === 0 ? (
          <div className="fp-vacio">
            <strong>No hay presupuestos para este mes.</strong>
            <p>
              Crea un presupuesto para controlar los gastos de una categoría.
            </p>
          </div>
        ) : !errorConsulta ? (
          <div className="fp-registros">
            {registros.map((p) => (
              <article
                key={p.id ?? `${p.categoria_id}-${p.mes}`}
                className="fp-registro"
              >
                <div className="fp-registro-cabecera">
                  <div>
                    <h4>{p.categoria}</h4>
                    <span className={`fp-estado-etiqueta fp-${p.estado.clase}`}>
                      {p.estado.texto}
                    </span>
                  </div>

                  <div className="fp-registro-acciones">
                    <button
                      type="button"
                      className="fp-boton fp-boton-secundario"
                      onClick={() => abrirEdicion(p)}
                      disabled={guardando || eliminando}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="fp-boton fp-boton-peligro"
                      onClick={() => solicitarEliminacion(p)}
                      disabled={guardando || eliminando}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="fp-registro-valores">
                  <div>
                    <span>Gastado</span>
                    <strong>{formatoDinero(p.gastado)}</strong>
                  </div>
                  <div>
                    <span>Límite</span>
                    <strong>{formatoDinero(p.limite)}</strong>
                  </div>
                  <div>
                    <span>
                      {p.disponible < 0 ? "Excedente" : "Disponible"}
                    </span>
                    <strong>
                      {formatoDinero(Math.abs(p.disponible))}
                    </strong>
                  </div>
                </div>

                <div
                  className="fp-barra"
                  role="progressbar"
                  aria-label={`Consumo de ${p.categoria}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(
                    100,
                    Math.max(0, p.porcentaje)
                  )}
                  aria-valuetext={`${p.porcentaje.toFixed(1)}% consumido`}
                >
                  <span
                    className={`fp-barra-relleno fp-${p.estado.clase}`}
                    style={{
                      width: `${Math.min(100, Math.max(0, p.porcentaje))}%`,
                    }}
                  />
                </div>

                <div className="fp-registro-pie">
                  <span>{p.porcentaje.toFixed(1)}% consumido</span>
                  <span>
                    Alertas: {p.umbral_medio}% / {p.umbral_alto}%
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

{formularioVisible && (
        <dialog
          ref={dialogoPresupuestoRef}
          className="fp-formulario-panel"
          aria-label={editando ? "Editar presupuesto" : "Nuevo presupuesto"}
          onCancel={(evento) => {
            evento.preventDefault();
            if (!guardando) cancelar();
          }}
        >
          <div className="fp-formulario-cabecera">
            <h3>
              {editando ? "Editar presupuesto" : "Nuevo presupuesto"}
            </h3>
            <button
              type="button"
              className="fp-cerrar"
              onClick={cancelar}
              disabled={guardando}
              aria-label="Cerrar formulario"
            >
              ×
            </button>
          </div>

          <form onSubmit={guardar} noValidate>
            {errores.general && (
              <p className="fp-mensaje fp-mensaje-error" role="alert">
                {errores.general}
              </p>
            )}

            <div className="fp-formulario-grid">
              <label>
                <span>Categoría de gasto</span>
                <select
                  name="categoria_id"
                  value={formulario.categoria_id}
                  onChange={cambiarCampo}
                  disabled={editando || guardando}
                  aria-invalid={Boolean(errores.categoria_id)}
                >
                  <option value="">Selecciona una categoría</option>
                  {(editando
                    ? categorias.filter(
                        (c) => Number(c.id) ===
                          Number(formulario.categoria_id)
                      )
                    : categoriasDisponibles
                  ).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                  {editando &&
                    !categorias.some(
                      (c) => Number(c.id) ===
                        Number(formulario.categoria_id)
                    ) && (
                      <option value={formulario.categoria_id}>
                        Categoría actual
                      </option>
                    )}
                </select>
                {errores.categoria_id && (
                  <small>{errores.categoria_id}</small>
                )}
              </label>

              <label>
                <span>Mes</span>
                <input
                  type="month"
                  name="mes"
                  value={formulario.mes}
                  disabled
                  readOnly
                />
              </label>

              <label>
                <span>Límite mensual (RD$)</span>
                <input
                  type="number"
                  name="monto_limite"
                  min="0.01"
                  max={MAX_MONTO}
                  step="0.01"
                  value={formulario.monto_limite}
                  onChange={cambiarCampo}
                  disabled={guardando}
                  aria-invalid={Boolean(errores.monto_limite)}
                  placeholder="0.00"
                />
                {errores.monto_limite && (
                  <small>{errores.monto_limite}</small>
                )}
              </label>

              <label>
                <span>Umbral medio (%)</span>
                <input
                  type="number"
                  name="umbral_medio"
                  min="1"
                  max="99"
                  step="1"
                  value={formulario.umbral_medio}
                  onChange={cambiarCampo}
                  disabled={guardando}
                  aria-invalid={Boolean(errores.umbral_medio)}
                />
                {errores.umbral_medio && (
                  <small>{errores.umbral_medio}</small>
                )}
              </label>

              <label>
                <span>Umbral alto (%)</span>
                <input
                  type="number"
                  name="umbral_alto"
                  min="2"
                  max="100"
                  step="1"
                  value={formulario.umbral_alto}
                  onChange={cambiarCampo}
                  disabled={guardando}
                  aria-invalid={Boolean(errores.umbral_alto)}
                />
                {errores.umbral_alto && (
                  <small>{errores.umbral_alto}</small>
                )}
              </label>
            </div>

            <div className="fp-formulario-acciones">
              <button
                type="button"
                className="fp-boton fp-boton-secundario"
                onClick={cancelar}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="fp-boton fp-boton-primario"
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar presupuesto"}
              </button>
            </div>
          </form>
        </dialog>
      )}

      {presupuestoAEliminar && (
        <dialog
          ref={dialogoEliminacionRef}
          className="fp-formulario-panel fp-confirmacion-panel"
          aria-labelledby="fp-confirmacion-eliminacion-titulo"
          aria-describedby="fp-confirmacion-eliminacion-descripcion"
          aria-busy={eliminando}
          onCancel={(evento) => {
            evento.preventDefault();
            if (!eliminando) cancelarEliminacion();
          }}
        >
          <div className="fp-formulario-cabecera">
            <h3 id="fp-confirmacion-eliminacion-titulo">
              ¿Eliminar presupuesto?
            </h3>
          </div>

          <p className="fp-confirmacion-detalle">
            Presupuesto de <strong>{presupuestoAEliminar.categoria}</strong> para{" "}
            <strong>{formatoMes(presupuestoAEliminar.mes)}</strong>.
          </p>
          <p id="fp-confirmacion-eliminacion-descripcion">
            Se eliminará este presupuesto mensual, pero los gastos registrados
            permanecerán intactos.
          </p>

          {errorEliminacion && (
            <p className="fp-mensaje fp-mensaje-error" role="alert">
              {errorEliminacion}
            </p>
          )}

          <div className="fp-formulario-acciones">
            <button
              type="button"
              className="fp-boton fp-boton-secundario"
              onClick={cancelarEliminacion}
              disabled={eliminando}
              autoFocus
            >
              Cancelar
            </button>
            <button
              type="button"
              className="fp-boton fp-boton-peligro"
              onClick={confirmarEliminacion}
              disabled={eliminando}
            >
              {eliminando ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </dialog>
      )}
    </section>
  );
}