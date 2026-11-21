import { useEffect, useRef, useState } from "react";
import "./Dashboard.css";
import KpiIcon from "./KpiIcon";

const tarjetas = [
  { id: "balance", titulo: "Balance" },
  { id: "ingresos", titulo: "Ingresos" },
  { id: "gastos", titulo: "Gastos" },
];

const formatoMoneda = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
});

function Dashboard({ transacciones = [], transaccionesHistoricas = [], mesSeleccionado, cargando = false, error = "", onVerHistorial, limiteGastos = null, cargandoLimite = false, errorLimite = "", onGuardarLimite }) {
  // Estado local del dialogo de presupuesto.
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [montoEditado, setMontoEditado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const campoMontoRef = useRef(null);
  const botonEditarRef = useRef(null);
  const limiteNumerico = limiteGastos == null ? NaN : Number(limiteGastos.monto);
  const limiteValido = Number.isFinite(limiteNumerico) && limiteNumerico > 0;

  useEffect(() => {
    if (!dialogoAbierto) return undefined;
    campoMontoRef.current?.focus();
    function cerrarConEscape(evento) {
      if (evento.key === "Escape" && !guardando) setDialogoAbierto(false);
    }
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [dialogoAbierto, guardando]);

  function abrirDialogo() {
    if (guardando || cargandoLimite) return;
    setMontoEditado(limiteValido ? String(limiteNumerico) : "");
    setErrorFormulario("");
    setDialogoAbierto(true);
  }

  function cerrarDialogo() {
    if (guardando) return;
    setDialogoAbierto(false);
    setErrorFormulario("");
    requestAnimationFrame(() => botonEditarRef.current?.focus());
  }

  async function enviarLimite(evento) {
    evento.preventDefault();
    if (guardando) return;
    const texto = montoEditado.trim();
    const valor = Number(texto);
    if (!texto || !Number.isFinite(valor) || valor <= 0 || !/^\d+(?:\.\d{1,2})?$/.test(texto) || valor > 9999999999.99) {
      setErrorFormulario("Introduce un monto positivo valido, con un maximo de dos decimales.");
      return;
    }
    if (typeof onGuardarLimite !== "function") {
      setErrorFormulario("No esta disponible la actualizacion del limite.");
      return;
    }
    setGuardando(true);
    setErrorFormulario("");
    try {
      await onGuardarLimite(valor);
      setDialogoAbierto(false);
      requestAnimationFrame(() => botonEditarRef.current?.focus());
    } catch (fallo) {
      setErrorFormulario(fallo?.message || "No se pudo guardar el limite.");
    } finally {
      setGuardando(false);
    }
  }
  // Indicadores financieros del mes seleccionado.
  const totales = transacciones.reduce(
    (acumulado, transaccion) => {
      const monto = Number(transaccion.monto);

      if (!Number.isFinite(monto)) {
        return acumulado;
      }

      if (transaccion.tipo === "ingreso") {
        acumulado.ingresos += monto;
      } else if (transaccion.tipo === "gasto") {
        acumulado.gastos += monto;
      }

      return acumulado;
    },
    { ingresos: 0, gastos: 0 }
  );

  const valores = {
    balance: totales.ingresos - totales.gastos,
    ingresos: totales.ingresos,
    gastos: totales.gastos,
  };

  // Flujo de ingresos: seis meses reales.
  const mesesFlujo = Array.from({ length: 6 }, (_, indice) => {
    const [anio, mes] = mesSeleccionado.split("-").map(Number);
    const fecha = new Date(anio, mes - 1 - (5 - indice), 1);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    const etiqueta = fecha.toLocaleDateString("es-DO", { month: "short" });

    const monto = transaccionesHistoricas.reduce((suma, transaccion) => {
      if (transaccion.tipo !== "ingreso") return suma;
      if (String(transaccion.fecha ?? "").slice(0, 7) !== clave) return suma;

      const valor = Number(transaccion.monto);
      return Number.isFinite(valor) && valor > 0 ? suma + valor : suma;
    }, 0);

    return { clave, etiqueta, monto };
  });

  const maximoFlujo = Math.max(
    10000,
    Math.ceil(Math.max(...mesesFlujo.map((mes) => mes.monto)) / 5000) * 5000
  );
  const recientes = transacciones.slice(0, 5);
  // Consumo mensual real y categoria de mayor gasto.
  const porcentajeConsumo = limiteValido ? (totales.gastos / limiteNumerico) * 100 : 0;
  const porcentajeAguja = Math.min(100, Math.max(0, porcentajeConsumo));
  const anguloAguja = Math.PI - (porcentajeAguja / 100) * Math.PI;
  // Aguja corta, tangente al arco, sin cruzar la lectura central.
  const agujaRadioExterior = 155;
  const agujaRadioInterior = 105;
  const agujaX1 = 200 + agujaRadioExterior * Math.cos(anguloAguja);
  const agujaY1 = 194 - agujaRadioExterior * Math.sin(anguloAguja);
  const agujaX2 = 200 + agujaRadioInterior * Math.cos(anguloAguja);
  const agujaY2 = 194 - agujaRadioInterior * Math.sin(anguloAguja);
  const gastosPorCategoria = transacciones.reduce((acumulado, transaccion) => {
    if (transaccion.tipo !== "gasto") return acumulado;
    const monto = Number(transaccion.monto);
    if (!Number.isFinite(monto) || monto <= 0) return acumulado;
    const categoria = String(transaccion.categoria || "Sin categoria").trim() || "Sin categoria";
    acumulado[categoria] = (acumulado[categoria] || 0) + monto;
    return acumulado;
  }, {});
  const [categoriaMayor, montoCategoriaMayor] = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))[0] || ["Sin gastos registrados", 0];
  const formatoEntero = (monto) => `RD$ ${Math.round(monto).toLocaleString("en-US")}`;

  return (
    <section className="fintrack-dashboard" aria-label="Resumen financiero">
      <div className="fintrack-kpis">
        {tarjetas.map((tarjeta) => (
          <article className="fintrack-kpi" key={tarjeta.id}>
            <div className="fintrack-kpi-icono">
              <KpiIcon tipo={tarjeta.id} />
            </div>
            <div className="fintrack-kpi-contenido">
              <span className="fintrack-kpi-titulo">{tarjeta.titulo}</span>
              <strong className="fintrack-kpi-valor">
                {cargando || error
                  ? "—"
                  : formatoMoneda.format(valores[tarjeta.id])}
              </strong>
            </div>
            <span className="fintrack-kpi-decorativo" aria-hidden="true">
              <KpiIcon tipo={tarjeta.id} decorativo />
            </span>
          </article>
        ))}
      </div>

      <section className="fintrack-historial" aria-labelledby="fintrack-historial-titulo">
        <div className="fintrack-historial-cabecera">
          <h2 id="fintrack-historial-titulo">
              <span className="fintrack-historial-icono" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M8 13h8M8 17h8" />
                </svg>
              </span>
              Transacciones recientes
            </h2>
          <button
            type="button"
            className="fintrack-historial-enlace" onClick={onVerHistorial}
          >
            Ver historial completo
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {cargando ? (
          <p role="status">Cargando transacciones...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : recientes.length === 0 ? (
          <p role="status">No tienes transacciones registradas.</p>
        ) : (
          <div className="fintrack-historial-contenedor">
            <table className="fintrack-historial-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((transaccion) => (
                  <tr key={transaccion.id}>
                    <td>{String(transaccion.fecha).slice(0, 10)}</td>
                    <td>{transaccion.descripcion || "Sin descripción"}</td>
                    <td>{transaccion.categoria || "Sin categoría"}</td>
                    <td>
                      <span
                        className={`fintrack-tipo-etiqueta ${
                          transaccion.tipo === "ingreso"
                            ? "fintrack-tipo-ingreso"
                            : transaccion.tipo === "gasto"
                              ? "fintrack-tipo-gasto"
                              : "fintrack-tipo-desconocido"
                        }`}
                      >
                        {transaccion.tipo === "ingreso"
                          ? "Ingreso"
                          : transaccion.tipo === "gasto"
                            ? "Gasto"
                            : "Tipo desconocido"}
                      </span>
                    </td>
                    <td>{formatoMoneda.format(Number(transaccion.monto))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="fintrack-graficas-v12">
        <section className="fintrack-flujo-ingresos" aria-labelledby="fintrack-flujo-titulo">
          <div className="fintrack-flujo-cabecera">
            <div className="fintrack-flujo-titulo">
              <span className="fintrack-flujo-icono">
                <svg viewBox="0 0 64 64" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Moneda con flechas circulares">
                  <path d="M12 25a22 22 0 0 1 37-9M41 16h8V8M52 39a22 22 0 0 1-37 9M23 48h-8v8" />
                  <circle cx="32" cy="32" r="13" />
                  <path d="M37 26h-7a4 4 0 0 0 0 8h4a4 4 0 0 1 0 8h-7M32 23v22" />
                </svg>
              </span>
              <h2 id="fintrack-flujo-titulo">Flujo de ingresos</h2>
            </div>
          </div>
          {cargando ? (
            <p role="status">Cargando ingresos...</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : (
            <div className="fintrack-flujo-chart">
              <div className="fintrack-flujo-yaxis" aria-hidden="true">
                {[4, 3, 2, 1, 0].map((nivel) => (
                  <span key={nivel}>
                    {Math.round(maximoFlujo * nivel / 4).toLocaleString("en-US")}
                  </span>
                ))}
              </div>
              <div className="fintrack-flujo-plot">
                {mesesFlujo.map((mes) => (
                  <div
                    className="fintrack-flujo-barcol"
                    key={mes.clave}
                    title={`${mes.etiqueta}: ${formatoMoneda.format(mes.monto)}`}
                    aria-label={`${mes.etiqueta}: ${formatoMoneda.format(mes.monto)}`}
                  >
                    <div
                      className="fintrack-flujo-bar"
                      style={{ height: `${(mes.monto / maximoFlujo) * 88}%` }}
                    />
                    <span className="fintrack-flujo-mes">{mes.etiqueta}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
        <section className="fintrack-indicador-gastos" aria-labelledby="fintrack-indicador-titulo">
          <div className="fintrack-indicador-cabecera">
            <div className="fintrack-indicador-cabecera-fila">
              <h2 id="fintrack-indicador-titulo">
                <span className="fintrack-indicador-icono" aria-hidden="true">
                  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 24a13 13 0 1 1 22 0" />
                    <path d="M16 16l7-7" />
                    <circle cx="16" cy="16" r="2" fill="currentColor" stroke="none" />
                    <path d="M6 17h3M16 3v3M26 17h-3" />
                  </svg>
                </span>
                Indicador de gastos
              </h2>
              <button type="button" className="fintrack-indicador-editar" ref={botonEditarRef} onClick={abrirDialogo} disabled={cargandoLimite || guardando}>⚙ Editar límite</button>
            </div>
          </div>
          {cargando || cargandoLimite ? (
            <p role="status">Cargando indicador de gastos...</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : (
            <>
              <div className="fintrack-indicador-medidor">
                <svg viewBox="0 0 400 240" role="img" aria-label={limiteValido ? `Presupuesto consumido: ${porcentajeConsumo.toFixed(1)} por ciento` : "Limite mensual no disponible"}>
                  <defs>
                    <linearGradient id="fintrack-indicador-degradado" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#54d76b" />
                      <stop offset="47%" stopColor="#c9fa55" />
                      <stop offset="73%" stopColor="#ffc447" />
                      <stop offset="100%" stopColor="#e65349" />
                    </linearGradient>
                  </defs>
                  <path d="M 54 194 A 146 146 0 0 1 346 194" fill="none" stroke="#285c4a" strokeWidth="27" strokeLinecap="round" />
                  <path d="M 54 194 A 146 146 0 0 1 346 194" fill="none" stroke="url(#fintrack-indicador-degradado)" strokeWidth="27" strokeLinecap="round" />
                  {limiteValido && <>
                    <line x1={agujaX1} y1={agujaY1} x2={agujaX2} y2={agujaY2} stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
                  </>}
                </svg>
                <div className="fintrack-indicador-lectura" aria-live="polite">
                  <strong>{formatoEntero(totales.gastos)}</strong>
                  <span>{limiteValido ? `de ${formatoEntero(limiteNumerico)}` : "Configura tu límite mensual"}</span>
                  {limiteValido && <span className="fintrack-indicador-porcentaje">{porcentajeConsumo.toFixed(1)}% del límite</span>}
                </div>
              </div>
              {errorLimite && <p role="alert" className="fintrack-indicador-error">{errorLimite}</p>}
              <p className="fintrack-indicador-categoria">🛒 Mayor consumo: <strong>{categoriaMayor}{montoCategoriaMayor > 0 ? ` · ${formatoMoneda.format(montoCategoriaMayor)}` : ""}</strong></p>
            </>
          )}
        </section>
      </div>
      {dialogoAbierto && (
        <div className="fintrack-limite-fondo" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) cerrarDialogo(); }}>
          <div className="fintrack-limite-dialogo" role="dialog" aria-modal="true" aria-labelledby="fintrack-limite-titulo">
            <h2 id="fintrack-limite-titulo">Editar límite mensual</h2>
            <form onSubmit={enviarLimite}>
              <label htmlFor="fintrack-limite-monto">Monto del límite mensual (RD$)</label>
              <input ref={campoMontoRef} id="fintrack-limite-monto" type="number" min="0.01" max="9999999999.99" step="0.01" required value={montoEditado} onChange={(evento) => setMontoEditado(evento.target.value)} disabled={guardando} />
              {errorFormulario && <p role="alert" className="fintrack-limite-error">{errorFormulario}</p>}
              <div className="fintrack-limite-acciones">
                <button type="button" onClick={cerrarDialogo} disabled={guardando}>Cancelar</button>
                <button type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
