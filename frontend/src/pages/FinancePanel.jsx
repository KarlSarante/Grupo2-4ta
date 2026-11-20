import { useEffect, useRef, useState } from "react";
import IngresoForm from "./IngresoForm.jsx";
import GastoForm from "./GastoForm.jsx";
import { obtenerIngresos } from "../services/ingresoService.js";
import { obtenerTransacciones } from "../services/financeService.js";
import { crearCategoria, obtenerCategorias } from "../services/categoriaService.js";
import {
  guardarPresupuesto,
  obtenerPresupuestos,
  obtenerNotificaciones,
} from "../services/presupuestoService.js";
import {
  crearObjetivo,
  obtenerObjetivos,
  agregarAportacion,
} from "../services/objetivoService.js";
import { obtenerGastos } from "../services/gastoService.js";

// HU004 / #64: Panel financiero y navegación visual.
function FinancePanel({ usuario, token, onLogout }) {
  const [pestanaActiva, setPestanaActiva] = useState(() => {
    const guardada = sessionStorage.getItem("finanzas-pestana");

    return ["resumen", "ingresos", "gastos", "categorias", "metas", "objetivos"].includes(guardada)
      ? guardada
      : "ingresos";
  });

  const [vistaIngresos, setVistaIngresos] = useState(() => {
    const guardada = sessionStorage.getItem("finanzas-vista-ingresos");

    return ["listado", "formulario"].includes(guardada)
      ? guardada
      : "listado";
  });

  // HU005: Vista activa dentro de la pestaña de gastos.
  const [vistaGastos, setVistaGastos] = useState(() => {
    const guardada = sessionStorage.getItem("finanzas-vista-gastos");

    return ["listado", "formulario"].includes(guardada)
      ? guardada
      : "listado";
  });
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const referenciaPerfil = useRef(null);
  // HU006: Historial general de ingresos y gastos.
  const [transacciones, setTransacciones] = useState([]);
  const [cargandoTransacciones, setCargandoTransacciones] = useState(false);
  const [errorTransacciones, setErrorTransacciones] = useState("");
  const [recargaTransacciones, setRecargaTransacciones] = useState(0);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [tipoCategoria, setTipoCategoria] = useState("gasto");
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [errorCategorias, setErrorCategorias] = useState("");
  const [mensajeCategoria, setMensajeCategoria] = useState("");
  const mesActual = new Date().toISOString().slice(0, 7);
  const [mesMeta, setMesMeta] = useState(mesActual);
  const [categoriasGasto, setCategoriasGasto] = useState([]);
  const [categoriaMeta, setCategoriaMeta] = useState("");
  const [montoMeta, setMontoMeta] = useState("");
  const [umbralMedio, setUmbralMedio] = useState(50);
  const [umbralAlto, setUmbralAlto] = useState(80);
  const [presupuestos, setPresupuestos] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [guardandoMeta, setGuardandoMeta] = useState(false);
  const [errorMeta, setErrorMeta] = useState("");
  const [mensajeMeta, setMensajeMeta] = useState("");
  const [avisoPresupuesto, setAvisoPresupuesto] = useState("");
  const [objetivos, setObjetivos] = useState([]);
  const [nombreObjetivo, setNombreObjetivo] = useState("");
  const [montoObjetivo, setMontoObjetivo] = useState("");
  const [montoInicialObjetivo, setMontoInicialObjetivo] = useState("");
  const [fechaLimiteObjetivo, setFechaLimiteObjetivo] = useState("");
  const [guardandoObjetivo, setGuardandoObjetivo] = useState(false);
  const [errorObjetivo, setErrorObjetivo] = useState("");
  const [mensajeObjetivo, setMensajeObjetivo] = useState("");
  const [aportaciones, setAportaciones] = useState({});
  // HU006: Paginación del historial general de transacciones.
  const [paginaTransacciones, setPaginaTransacciones] = useState(1);
  const transaccionesPorPagina = 5;

  useEffect(() => {
    if (pestanaActiva !== "resumen") return;

    let activo = true;

    async function cargarTransacciones() {
      setCargandoTransacciones(true);
      setErrorTransacciones("");

      try {
        const datos = await obtenerTransacciones(token);

        if (activo) {
          setTransacciones(datos);
        }
      } catch (error) {
        if (activo) {
          setErrorTransacciones(
            error.message || "No se pudieron consultar las transacciones."
          );
        }
      } finally {
        if (activo) {
          setCargandoTransacciones(false);
        }
      }
    }

    cargarTransacciones();

    return () => {
      activo = false;
    };
  }, [pestanaActiva, token, recargaTransacciones]);

  useEffect(() => {
    if (pestanaActiva !== "metas") return;

    let activo = true;

    async function cargarMetas() {
      setErrorMeta("");
      try {
        const [categoriasResultado, presupuestosResultado, notificacionesResultado] =
          await Promise.all([
            obtenerCategorias(token, "gasto"),
            obtenerPresupuestos(mesMeta),
            obtenerNotificaciones(),
          ]);

        if (activo) {
          setCategoriasGasto(categoriasResultado);
          setPresupuestos(presupuestosResultado.presupuestos);
          setNotificaciones(notificacionesResultado.notificaciones);
        }
      } catch (error) {
        if (activo) {
          setErrorMeta(error.message || "No se pudieron cargar las metas.");
        }
      }
    }

    cargarMetas();
    return () => {
      activo = false;
    };
  }, [pestanaActiva, token, mesMeta]);

  useEffect(() => {
    if (pestanaActiva !== "objetivos") return;

    let activo = true;

    async function cargarObjetivos() {
      setErrorObjetivo("");
      try {
        const resultado = await obtenerObjetivos();
        if (activo) setObjetivos(resultado.objetivos);
      } catch (error) {
        if (activo) {
          setErrorObjetivo(error.message || "No se pudieron cargar las metas.");
        }
      }
    }

    cargarObjetivos();
    return () => {
      activo = false;
    };
  }, [pestanaActiva, token]);
  // HU004 / #66: Confirmación después de registrar un ingreso.
  const [mensajeIngreso, setMensajeIngreso] = useState("");
  const [mensajeGasto, setMensajeGasto] = useState("");

  const [gastos, setGastos] = useState([]);
  const [cargandoGastos, setCargandoGastos] = useState(false);
  const [errorGastos, setErrorGastos] = useState("");
  const [recargaGastos, setRecargaGastos] = useState(0);

  // HU005: Paginación del historial de gastos.
  const [paginaGastos, setPaginaGastos] = useState(1);
  const gastosPorPagina = 5;

  // HU004 / #66: Historial de ingresos del usuario autenticado.
  const [ingresos, setIngresos] = useState([]);
  const [cargandoIngresos, setCargandoIngresos] = useState(true);
  const [errorIngresos, setErrorIngresos] = useState("");
  const [recargaIngresos, setRecargaIngresos] = useState(0);

  // HU004 / #66: Paginación del historial de ingresos.
  const [paginaIngresos, setPaginaIngresos] = useState(1);
  const ingresosPorPagina = 5;

  // Conservar la pestaña activa al actualizar la página.
  useEffect(() => {
    sessionStorage.setItem("finanzas-pestana", pestanaActiva);
  }, [pestanaActiva]);

  // Conservar la vista de ingresos al actualizar la página.
  useEffect(() => {
    sessionStorage.setItem("finanzas-vista-ingresos", vistaIngresos);
  }, [vistaIngresos]);

  // HU005: Conservar la vista de gastos al actualizar la página.
  useEffect(() => {
    sessionStorage.setItem("finanzas-vista-gastos", vistaGastos);
  }, [vistaGastos]);
  // HU004 / #66: Cargar el historial de ingresos del usuario autenticado.
  useEffect(() => {
    if (pestanaActiva !== "ingresos" || vistaIngresos !== "listado") {
      return;
    }

    let activo = true;

    async function cargarIngresos() {
      setCargandoIngresos(true);
      setErrorIngresos("");

      try {
        const sesion = JSON.parse(
          localStorage.getItem("sesion") ||
          sessionStorage.getItem("sesion") ||
          "null"
        );

        if (!sesion?.token) {
          throw new Error(
            "La sesión ha expirado. Inicia sesión nuevamente."
          );
        }

        const datos = await obtenerIngresos(sesion.token);

        if (activo) {
          setIngresos(datos);
        }
      } catch (error) {
        if (activo) {
          setIngresos([]);
          setErrorIngresos(
            error.message || "No se pudieron cargar los ingresos."
          );
        }
      } finally {
        if (activo) {
          setCargandoIngresos(false);
        }
      }
    }

    cargarIngresos();

    return () => {
      activo = false;
    };
  }, [pestanaActiva, vistaIngresos, recargaIngresos]);

  // HU005: Cargar el historial de gastos del usuario autenticado.
  useEffect(() => {
    if (pestanaActiva !== "gastos" || vistaGastos !== "listado") {
      return;
    }

    let activo = true;

    async function cargarGastos() {
      setCargandoGastos(true);
      setErrorGastos("");

      try {
        const datos = await obtenerGastos();

        if (activo) {
          setGastos(datos);
        }
      } catch (error) {
        if (activo) {
          setGastos([]);
          setErrorGastos(
            error.message || "No se pudieron cargar los gastos."
          );
        }
      } finally {
        if (activo) {
          setCargandoGastos(false);
        }
      }
    }

    cargarGastos();

    return () => {
      activo = false;
    };
  }, [pestanaActiva, vistaGastos, recargaGastos]);

  // Cerrar el menú al hacer clic fuera o presionar Escape.
  useEffect(() => {
    if (!menuPerfilAbierto) {
      return;
    }

    function manejarClickExterior(evento) {
      if (
        referenciaPerfil.current &&
        !referenciaPerfil.current.contains(evento.target)
      ) {
        setMenuPerfilAbierto(false);
      }
    }

    function manejarTecla(evento) {
      if (evento.key === "Escape") {
        setMenuPerfilAbierto(false);
      }
    }

    document.addEventListener("pointerdown", manejarClickExterior);
    document.addEventListener("keydown", manejarTecla);

    return () => {
      document.removeEventListener("pointerdown", manejarClickExterior);
      document.removeEventListener("keydown", manejarTecla);
    };
  }, [menuPerfilAbierto]);

  function cambiarPestana(pestana) {
    setMensajeIngreso("");
    setMensajeCategoria("");
    setErrorCategorias("");
    setPestanaActiva(pestana);
    setVistaIngresos("listado");
    setVistaGastos("listado");
    setMensajeGasto("");
  }

  // HU004 / #66: Regresar al listado despues de agregar un ingreso y actualizar los ingresos.
  function manejarIngresoRegistrado(mensaje) {
    setMensajeIngreso(mensaje || "Ingreso registrado correctamente.");
    setPaginaIngresos(1);
    setRecargaIngresos((anterior) => anterior + 1);
    setPestanaActiva("ingresos");
    setVistaIngresos("listado");
  }

  function manejarGastoRegistrado(mensaje, alertas = []) {
    setRecargaTransacciones((valor) => valor + 1);
    setMensajeGasto(mensaje || "Gasto registrado correctamente.");
    setPestanaActiva("gastos");
    setVistaGastos("listado");
    setRecargaGastos((anterior) => anterior + 1);
    setPaginaGastos(1);

    if (alertas.length > 0) {
      const nivel = Math.max(...alertas.map((alerta) => alerta.nivel));
      setAvisoPresupuesto(
        nivel >= 80
          ? `Alerta: alcanzaste el ${nivel}% de tu presupuesto mensual.`
          : `Aviso: alcanzaste el ${nivel}% de tu presupuesto mensual.`
      );
    }

    if (mensaje) {
      setMensajeIngreso(mensaje);
    }
  }

  // HU004 / #66: Calcular los registros visibles por página.
  const totalIngresos = ingresos.length;

  const totalPaginasIngresos = Math.max(
    1,
    Math.ceil(totalIngresos / ingresosPorPagina)
  );

  const paginaActualIngresos = Math.min(
    Math.max(1, paginaIngresos),
    totalPaginasIngresos
  );

  const indiceInicialIngresos =
    (paginaActualIngresos - 1) * ingresosPorPagina;

  const ingresosVisibles = ingresos.slice(
    indiceInicialIngresos,
    indiceInicialIngresos + ingresosPorPagina
  );

  // HU005: Calcular los gastos visibles por página.
  const totalGastos = gastos.length;

  const totalPaginasGastos = Math.max(
    1,
    Math.ceil(totalGastos / gastosPorPagina)
  );

  const paginaActualGastos = Math.min(
    Math.max(1, paginaGastos),
    totalPaginasGastos
  );

  const indiceInicialGastos =
    (paginaActualGastos - 1) * gastosPorPagina;

  const gastosVisibles = gastos.slice(
    indiceInicialGastos,
    indiceInicialGastos + gastosPorPagina
  );

  // HU006: Calcular las transacciones visibles por página.
  const totalTransacciones = transacciones.length;

  const totalPaginasTransacciones = Math.max(
    1,
    Math.ceil(totalTransacciones / transaccionesPorPagina)
  );

  const paginaActualTransacciones = Math.min(
    Math.max(1, paginaTransacciones),
    totalPaginasTransacciones
  );

  const indiceInicialTransacciones =
    (paginaActualTransacciones - 1) * transaccionesPorPagina;

  const transaccionesVisibles = transacciones.slice(
    indiceInicialTransacciones,
    indiceInicialTransacciones + transaccionesPorPagina
  );

  return (
    <main className="role-panel">
      <section className="role-card admin-card">
        {/* Cabecera compartida visualmente con AdminPanel. */}
        <header className="admin-cabecera">
          <div className="admin-cabecera-info">
            <p className="role-label">Panel financiero</p>

            <h1>Bienvenido, {usuario.nombre}</h1>

            <p>
              Gestiona tus ingresos, gastos y resumen financiero.
            </p>
          </div>

          {/* Menú de perfil y cierre de sesión. */}
          <div className="admin-perfil" ref={referenciaPerfil}>
            <button
              type="button"
              className="admin-perfil-boton"
              aria-label="Abrir menú de usuario"
              aria-expanded={menuPerfilAbierto}
              aria-controls="finanzas-menu-perfil"
              onClick={() =>
                setMenuPerfilAbierto((anterior) => !anterior)
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </button>

            {menuPerfilAbierto && (
              <div
                id="finanzas-menu-perfil"
                className="admin-perfil-menu"
              >
                <div className="admin-perfil-info">
                  <strong>{usuario.nombre}</strong>
                  <span>Usuario</span>
                </div>

                <button
                  type="button"
                  className="admin-perfil-salir"
                  onClick={() => {
                    sessionStorage.removeItem("finanzas-pestana");
                    sessionStorage.removeItem("finanzas-vista-ingresos");
                    sessionStorage.removeItem("finanzas-vista-gastos");
                    onLogout();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="m16 17 5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>

                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Navegación financiera. */}
        <nav
          className="admin-tabs"
          aria-label="Secciones financieras"
        >
          {[
            { id: "resumen", texto: "Resumen" },
            { id: "ingresos", texto: "Ingresos" },
            { id: "gastos", texto: "Gastos" },
            { id: "categorias", texto: "Categorías" },
            { id: "metas", texto: "Presupuesto" },
            { id: "objetivos", texto: "Mis metas financieras" },
          ].map((pestana) => (
            <button
              key={pestana.id}
              type="button"
              className={`admin-tab ${pestanaActiva === pestana.id
                ? "admin-tab-activa"
                : ""
                }`}
              aria-current={
                pestanaActiva === pestana.id
                  ? "page"
                  : undefined
              }
              onClick={() => cambiarPestana(pestana.id)}
            >
              {pestana.texto}
            </button>
          ))}
        </nav>

        {avisoPresupuesto && (
          <div className="presupuesto-aviso" role="alert">
            <span>{avisoPresupuesto}</span>
            <button
              type="button"
              onClick={() => setAvisoPresupuesto("")}
              aria-label="Cerrar aviso"
            >
              ×
            </button>
          </div>
        )}

        {/* HU006: Historial general de transacciones. */}
        {pestanaActiva === "resumen" && (
          <section className="admin-seccion historial-seccion">
            <div className="historial-cabecera">
              <h2>Historial de transacciones</h2>

              <button
                type="button"
                className="historial-actualizar"
                disabled={cargandoTransacciones}
                onClick={() => setRecargaTransacciones((valor) => valor + 1)}
              >
                Actualizar
              </button>
            </div>

            {cargandoTransacciones ? (
              <p role="status">Cargando transacciones...</p>
            ) : errorTransacciones ? (
              <p role="alert" className="historial-error">
                {errorTransacciones}
              </p>
            ) : transacciones.length === 0 ? (
              <p role="status">No tienes transacciones registradas.</p>
            ) : (
              <div className="historial-tabla-contenedor">
                <table className="historial-tabla">
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
                    {transaccionesVisibles.map((transaccion) => (
                      <tr key={transaccion.id}>
                        <td>
                          {String(transaccion.fecha).slice(0, 10)}
                        </td>

                        <td>
                          {transaccion.descripcion || "Sin descripción"}
                        </td>

                        <td>
                          {transaccion.categoria || "Sin categoría"}
                        </td>

                        <td>
                          <span
                            className={`tipo-transaccion tipo-${transaccion.tipo}`}
                          >
                            {transaccion.tipo === "ingreso"
                              ? "Ingreso"
                              : "Gasto"}
                          </span>
                        </td>

                        <td>
                          {new Intl.NumberFormat("es-DO", {
                            style: "currency",
                            currency: "DOP",
                          }).format(Number(transaccion.monto))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* HU006: Paginación del historial general. */}
            {!cargandoTransacciones &&
              !errorTransacciones &&
              totalTransacciones > transaccionesPorPagina && (
                <nav
                  className="usuarios-paginacion ingresos-paginacion"
                  aria-label="Paginación de transacciones"
                >
                  <p className="paginacion-resumen">
                    Mostrando {indiceInicialTransacciones + 1}–
                    {Math.min(
                      indiceInicialTransacciones + transaccionesPorPagina,
                      totalTransacciones
                    )} de {totalTransacciones} transacciones
                  </p>

                  <div className="paginacion-controles">
                    <button
                      type="button"
                      className="paginacion-boton"
                      disabled={paginaActualTransacciones === 1}
                      onClick={() =>
                        setPaginaTransacciones((anterior) =>
                          Math.max(1, anterior - 1)
                        )
                      }
                    >
                      Anterior
                    </button>

                    <span className="paginacion-indicador">
                      Página {paginaActualTransacciones} de {totalPaginasTransacciones}
                    </span>

                    <button
                      type="button"
                      className="paginacion-boton"
                      disabled={paginaActualTransacciones === totalPaginasTransacciones}
                      onClick={() =>
                        setPaginaTransacciones((anterior) =>
                          Math.min(totalPaginasTransacciones, anterior + 1)
                        )
                      }
                    >
                      Siguiente
                    </button>
                  </div>
                </nav>
              )}
          </section>
        )}

        {pestanaActiva === "objetivos" && (
          <section className="admin-seccion">
            <h2>Mis metas financieras</h2>
            <p>Crea objetivos de ahorro y registra cuánto vas aportando.</p>

            <form
              className="categorias-formulario"
              onSubmit={async (evento) => {
                evento.preventDefault();
                setGuardandoObjetivo(true);
                setErrorObjetivo("");
                setMensajeObjetivo("");

                try {
                  await crearObjetivo({
                    nombre: nombreObjetivo.trim(),
                    monto_objetivo: Number(montoObjetivo),
                    monto_actual: Number(montoInicialObjetivo || 0),
                    fecha_limite: fechaLimiteObjetivo || null,
                  });
                  setNombreObjetivo("");
                  setMontoObjetivo("");
                  setMontoInicialObjetivo("");
                  setFechaLimiteObjetivo("");
                  setMensajeObjetivo("Objetivo financiero creado correctamente.");
                  const resultado = await obtenerObjetivos();
                  setObjetivos(resultado.objetivos);
                } catch (error) {
                  setErrorObjetivo(error.message || "No se pudo crear el objetivo.");
                } finally {
                  setGuardandoObjetivo(false);
                }
              }}
            >
              <div className="categorias-campo">
                <label htmlFor="objetivo-nombre">Objetivo</label>
                <input
                  id="objetivo-nombre"
                  type="text"
                  value={nombreObjetivo}
                  onChange={(evento) => setNombreObjetivo(evento.target.value)}
                  minLength={2}
                  maxLength={100}
                  placeholder="Ej. Fondo de emergencia"
                  required
                  disabled={guardandoObjetivo}
                />
              </div>

              <div className="categorias-campo">
                <label htmlFor="objetivo-monto">Monto objetivo (RD$)</label>
                <input
                  id="objetivo-monto"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={montoObjetivo}
                  onChange={(evento) => setMontoObjetivo(evento.target.value)}
                  placeholder="Ej. 20000"
                  required
                  disabled={guardandoObjetivo}
                />
              </div>

              <div className="categorias-campo">
                <label htmlFor="objetivo-inicial">Ahorro inicial (RD$)</label>
                <input
                  id="objetivo-inicial"
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoInicialObjetivo}
                  onChange={(evento) => setMontoInicialObjetivo(evento.target.value)}
                  placeholder="Ej. 1000"
                  disabled={guardandoObjetivo}
                />
              </div>

              <div className="categorias-campo">
                <label htmlFor="objetivo-fecha">Fecha límite (opcional)</label>
                <input
                  id="objetivo-fecha"
                  type="date"
                  value={fechaLimiteObjetivo}
                  onChange={(evento) => setFechaLimiteObjetivo(evento.target.value)}
                  disabled={guardandoObjetivo}
                />
              </div>

              <button type="submit" disabled={guardandoObjetivo}>
                {guardandoObjetivo ? "Creando objetivo..." : "Crear objetivo"}
              </button>

              {mensajeObjetivo && (
                <p className="categorias-exito" role="status">{mensajeObjetivo}</p>
              )}
              {errorObjetivo && (
                <p className="categorias-error" role="alert">{errorObjetivo}</p>
              )}
            </form>

            {objetivos.length > 0 && (
              <div className="objetivos-listado">
                {objetivos.map((objetivo) => {
                  const actual = Number(objetivo.monto_actual);
                  const limite = Number(objetivo.monto_objetivo);
                  const porcentaje = limite > 0
                    ? Math.min(100, Math.round((actual / limite) * 100))
                    : 0;
                  const faltante = Math.max(0, limite - actual);
                  const aportacion = aportaciones[objetivo.id] ?? "";

                  return (
                    <article className="objetivo-item" key={objetivo.id}>
                      <div className="objetivo-encabezado">
                        <strong>{objetivo.nombre}</strong>
                        <span>{porcentaje}% logrado</span>
                      </div>

                      <div className="objetivo-progreso">
                        <div style={{ width: `${porcentaje}%` }} />
                      </div>

                      <p>
                        RD$ {actual.toLocaleString("es-DO")} ahorrados ·
                        Faltan RD$ {faltante.toLocaleString("es-DO")}
                      </p>
                      {objetivo.fecha_limite && (
                        <p>Fecha límite: {String(objetivo.fecha_limite).slice(0, 10)}</p>
                      )}

                      {objetivo.estado === "activo" && (
                        <div className="objetivo-aportacion">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={aportacion}
                            onChange={(evento) =>
                              setAportaciones((anteriores) => ({
                                ...anteriores,
                                [objetivo.id]: evento.target.value,
                              }))
                            }
                            placeholder="Aportación RD$"
                            aria-label={`Aportación para ${objetivo.nombre}`}
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setErrorObjetivo("");
                                await agregarAportacion(objetivo.id, Number(aportacion));
                                setAportaciones((anteriores) => ({
                                  ...anteriores,
                                  [objetivo.id]: "",
                                }));
                                setMensajeObjetivo("Aportación registrada correctamente.");
                                const resultado = await obtenerObjetivos();
                                setObjetivos(resultado.objetivos);
                              } catch (error) {
                                setErrorObjetivo(
                                  error.message || "No se pudo registrar la aportación."
                                );
                              }
                            }}
                            disabled={!Number(aportacion) || Number(aportacion) <= 0}
                          >
                            Aportar
                          </button>
                        </div>
                      )}

                      {objetivo.estado === "completado" && (
                        <p className="objetivo-completado">¡Objetivo completado!</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {pestanaActiva === "metas" && (
          <section className="admin-seccion">
            <h2>Presupuesto con alertas inteligente</h2>
            <p>Establece el presupuesto mensual de cada categoría de gasto.</p>

            <form
              className="categorias-formulario"
              onSubmit={async (evento) => {
                evento.preventDefault();
                setGuardandoMeta(true);
                setErrorMeta("");
                setMensajeMeta("");

                try {
                  await guardarPresupuesto({
                    categoria_id: Number(categoriaMeta),
                    mes: mesMeta,
                    monto_limite: Number(montoMeta),
                    umbral_medio: umbralMedio,
                    umbral_alto: umbralAlto,
                  });
                  setMontoMeta("");
                  setMensajeMeta("Meta financiera guardada correctamente.");
                  const resultado = await obtenerPresupuestos(mesMeta);
                  setPresupuestos(resultado.presupuestos);
                } catch (error) {
                  setErrorMeta(error.message || "No se pudo guardar la meta.");
                } finally {
                  setGuardandoMeta(false);
                }
              }}
              noValidate
            >
              <div className="categorias-campo">
                <label htmlFor="meta-mes">Mes</label>
                <input
                  id="meta-mes"
                  type="month"
                  value={mesMeta}
                  onChange={(evento) => setMesMeta(evento.target.value)}
                  required
                />
              </div>

              <div className="categorias-campo">
                <label htmlFor="meta-categoria">Categoría</label>
                <select
                  id="meta-categoria"
                  value={categoriaMeta}
                  onChange={(evento) => setCategoriaMeta(evento.target.value)}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasGasto.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="categorias-campo">
                <label htmlFor="meta-monto">Presupuesto mensual (RD$)</label>
                <input
                  id="meta-monto"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={montoMeta}
                  onChange={(evento) => setMontoMeta(evento.target.value)}
                  placeholder="Ej. 8000"
                  required
                />
              </div>

              <div className="meta-umbrales">
                <div className="categorias-campo">
                  <label htmlFor="meta-umbral-medio">Primer aviso (%)</label>
                  <input
                    id="meta-umbral-medio"
                    type="number"
                    min="1"
                    max="99"
                    value={umbralMedio}
                    onChange={(evento) => setUmbralMedio(Number(evento.target.value))}
                  />
                </div>
                <div className="categorias-campo">
                  <label htmlFor="meta-umbral-alto">Aviso urgente (%)</label>
                  <input
                    id="meta-umbral-alto"
                    type="number"
                    min="2"
                    max="100"
                    value={umbralAlto}
                    onChange={(evento) => setUmbralAlto(Number(evento.target.value))}
                  />
                </div>
              </div>

              <button type="submit" disabled={guardandoMeta}>
                {guardandoMeta ? "Guardando meta..." : "Guardar meta"}
              </button>

              {mensajeMeta && (
                <p className="categorias-exito" role="status">{mensajeMeta}</p>
              )}
              {errorMeta && (
                <p className="categorias-error" role="alert">{errorMeta}</p>
              )}
            </form>

            {presupuestos.length > 0 && (
              <div className="presupuesto-listado">
                {presupuestos.map((presupuesto) => {
                  const gastado = Number(presupuesto.gastado);
                  const limite = Number(presupuesto.monto_limite);
                  const porcentaje = limite > 0
                    ? Math.min(100, Math.round((gastado / limite) * 100))
                    : 0;

                  return (
                    <article className="presupuesto-item" key={presupuesto.id}>
                      <div>
                        <strong>{presupuesto.categoria}</strong>
                        <span>{porcentaje}% utilizado</span>
                      </div>
                      <div className="presupuesto-progreso">
                        <div style={{ width: `${porcentaje}%` }} />
                      </div>
                      <p>
                        RD$ {gastado.toLocaleString("es-DO")} de{" "}
                        RD$ {limite.toLocaleString("es-DO")}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}

            {notificaciones.length > 0 && (
              <div className="notificaciones-listado">
                <h3>Notificaciones</h3>
                {notificaciones.map((notificacion) => (
                  <p key={notificacion.id}>
                    {notificacion.categoria}: alcanzaste el {notificacion.nivel}% del
                    presupuesto de {notificacion.mes}.
                  </p>
                ))}
              </div>
            )}
          </section>
        )}

        {pestanaActiva === "categorias" && (
          <section className="admin-seccion">
            <h2>Mis categorías</h2>
            <p>
              Crea categorías personales para organizar tus ingresos y gastos.
            </p>

            <form
              className="categorias-formulario"
              onSubmit={async (evento) => {
                evento.preventDefault();
                setGuardandoCategoria(true);
                setErrorCategorias("");
                setMensajeCategoria("");

                try {
                  await crearCategoria(
                    {
                      nombre: nombreCategoria.trim(),
                      tipo: tipoCategoria,
                    },
                    token
                  );
                  setNombreCategoria("");
                  setMensajeCategoria("Categoría creada correctamente.");
                } catch (error) {
                  setErrorCategorias(
                    error.message || "No se pudo crear la categoría."
                  );
                } finally {
                  setGuardandoCategoria(false);
                }
              }}
            >
              <div className="categorias-campo">
                <label htmlFor="nueva-categoria-nombre">Nombre</label>
                <input
                  id="nueva-categoria-nombre"
                  type="text"
                  value={nombreCategoria}
                  onChange={(evento) => setNombreCategoria(evento.target.value)}
                  maxLength={100}
                  required
                  disabled={guardandoCategoria}
                  placeholder="Ej. Alimentación"
                />
              </div>

              <fieldset className="categorias-tipo" disabled={guardandoCategoria}>
                <legend>Tipo</legend>
                <label>
                  <input
                    type="radio"
                    name="tipo-nueva-categoria"
                    value="gasto"
                    checked={tipoCategoria === "gasto"}
                    onChange={(evento) => setTipoCategoria(evento.target.value)}
                  />
                  Gasto
                </label>
                <label>
                  <input
                    type="radio"
                    name="tipo-nueva-categoria"
                    value="ingreso"
                    checked={tipoCategoria === "ingreso"}
                    onChange={(evento) => setTipoCategoria(evento.target.value)}
                  />
                  Ingreso
                </label>
              </fieldset>

              <button type="submit" disabled={guardandoCategoria}>
                {guardandoCategoria ? "Creando categoría..." : "Crear categoría"}
              </button>

              {mensajeCategoria && (
                <p className="categorias-exito" role="status">
                  {mensajeCategoria}
                </p>
              )}
              {errorCategorias && (
                <p className="categorias-error" role="alert">
                  {errorCategorias}
                </p>
              )}
            </form>

          </section>
        )}

        {/* HU004 / #64: Registro de ingresos. */}
        {pestanaActiva === "ingresos" && (
          <>
            {vistaIngresos === "listado" && (

              <section className="admin-seccion">
                <div className="ingresos-encabezado">
                  <h2>Mis ingresos</h2>

                  <button
                    type="button"
                    className="categorias-crear-boton"
                    onClick={() => {
                      setMensajeIngreso("");
                      setVistaIngresos("formulario");
                    }}
                  >
                    + Registrar ingreso
                  </button>
                </div>

                {/* HU004 / #66: Confirmación visible después del registro. */}
                {mensajeIngreso && (
                  <p
                    className="ingresos-mensaje-exito"
                    role="status"
                  >
                    {mensajeIngreso}
                  </p>
                )}

                {/* HU004 / #66: Historial de ingresos del usuario. */}
                {cargandoIngresos ? (
                  <p role="status">Cargando ingresos...</p>
                ) : errorIngresos ? (
                  <div role="alert">
                    <p>{errorIngresos}</p>

                    <button
                      type="button"
                      className="categorias-crear-boton"
                      onClick={() =>
                        setRecargaIngresos((anterior) => anterior + 1)
                      }
                    >
                      Reintentar
                    </button>
                  </div>
                ) : ingresos.length === 0 ? (
                  <div className="ingresos-estado-vacio">
                    <h3>Todavía no tienes ingresos registrados</h3>
                    <p>
                      Registra tu primer ingreso para comenzar a llevar
                      el control de tus finanzas.
                    </p>
                  </div>
                ) : (
                  <div className="historial-tabla-contenedor">
                    <table className="historial-tabla">
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
                        {ingresosVisibles.map((ingreso) => (
                          <tr key={ingreso.id}>
                            <td>
                              {String(ingreso.fecha).slice(0, 10)}
                            </td>

                            <td>
                              {ingreso.descripcion || "Sin descripción"}
                            </td>

                            <td>
                              {ingreso.categoria_nombre || "Sin categoría"}
                            </td>

                            <td>
                              <span className="tipo-transaccion tipo-ingreso">
                                Ingreso
                              </span>
                            </td>

                            <td>
                              {new Intl.NumberFormat("es-DO", {
                                style: "currency",
                                currency: "DOP",
                              }).format(Number(ingreso.monto))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* HU004 / #66: Controles de paginación del historial. */}
                {!cargandoIngresos &&
                  !errorIngresos &&
                  totalIngresos > ingresosPorPagina && (
                    <nav
                      className="usuarios-paginacion ingresos-paginacion"
                      aria-label="Paginación de ingresos"
                    >
                      <p className="paginacion-resumen">
                        Mostrando {indiceInicialIngresos + 1}–
                        {Math.min(
                          indiceInicialIngresos + ingresosPorPagina,
                          totalIngresos
                        )} de {totalIngresos} ingresos
                      </p>

                      <div className="paginacion-controles">
                        <button
                          type="button"
                          className="paginacion-boton"
                          disabled={paginaActualIngresos === 1}
                          onClick={() =>
                            setPaginaIngresos((anterior) =>
                              Math.max(1, anterior - 1)
                            )
                          }
                        >
                          Anterior
                        </button>

                        <span className="paginacion-indicador">
                          Página {paginaActualIngresos} de {totalPaginasIngresos}
                        </span>

                        <button
                          type="button"
                          className="paginacion-boton"
                          disabled={paginaActualIngresos === totalPaginasIngresos}
                          onClick={() =>
                            setPaginaIngresos((anterior) =>
                              Math.min(totalPaginasIngresos, anterior + 1)
                            )
                          }
                        >
                          Siguiente
                        </button>
                      </div>
                    </nav>
                  )}
              </section>

            )}

            {vistaIngresos === "formulario" && (
              <IngresoForm
                onVolver={() =>
                  setVistaIngresos("listado")
                }
                onIngresoRegistrado={manejarIngresoRegistrado}
              />
            )}
          </>
        )}

        {/* HU005: Registro de gastos. */}
        {pestanaActiva === "gastos" && (
          <>
            {vistaGastos === "listado" && (
              <section className="admin-seccion">
                <div className="ingresos-encabezado">
                  <h2>Mis gastos</h2>

                  <button
                    type="button"
                    className="categorias-crear-boton"
                    onClick={() => setVistaGastos("formulario")}
                  >
                    + Registrar gasto
                  </button>
                </div>

                {mensajeGasto && (
                  <p className="ingresos-mensaje-exito" role="status">
                    {mensajeGasto}
                  </p>
                )}
                {/* HU005: Historial de gastos del usuario. */}
                {cargandoGastos ? (
                  <p role="status">Cargando gastos...</p>
                ) : errorGastos ? (
                  <div role="alert">
                    <p>{errorGastos}</p>

                    <button
                      type="button"
                      className="categorias-crear-boton"
                      onClick={() =>
                        setRecargaGastos((anterior) => anterior + 1)
                      }
                    >
                      Reintentar
                    </button>
                  </div>
                ) : gastos.length === 0 ? (
                  <div className="ingresos-estado-vacio">
                    <h3>Todavía no tienes gastos registrados</h3>
                    <p>
                      Registra tu primer gasto para comenzar a llevar
                      el control de tus finanzas.
                    </p>
                  </div>
                ) : (
                  <div className="historial-tabla-contenedor">
                    <table className="historial-tabla">
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
                        {gastosVisibles.map((gasto) => (
                          <tr key={gasto.id}>
                            <td>{String(gasto.fecha).slice(0, 10)}</td>

                            <td>
                              {gasto.descripcion || "Sin descripción"}
                            </td>

                            <td>
                              {gasto.categoria || "Sin categoría"}
                            </td>

                            <td>
                              <span className="tipo-transaccion tipo-gasto">
                                Gasto
                              </span>
                            </td>

                            <td>
                              {new Intl.NumberFormat("es-DO", {
                                style: "currency",
                                currency: "DOP",
                              }).format(Number(gasto.monto))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* HU005: Paginación del historial de gastos. */}
                {!cargandoGastos &&
                  !errorGastos &&
                  totalGastos > gastosPorPagina && (
                    <nav
                      className="usuarios-paginacion ingresos-paginacion"
                      aria-label="Paginación de gastos"
                    >
                      <p className="paginacion-resumen">
                        Mostrando {indiceInicialGastos + 1}–
                        {Math.min(
                          indiceInicialGastos + gastosPorPagina,
                          totalGastos
                        )} de {totalGastos} gastos
                      </p>

                      <div className="paginacion-controles">
                        <button
                          type="button"
                          className="paginacion-boton"
                          disabled={paginaActualGastos === 1}
                          onClick={() =>
                            setPaginaGastos((anterior) =>
                              Math.max(1, anterior - 1)
                            )
                          }
                        >
                          Anterior
                        </button>

                        <span className="paginacion-indicador">
                          Página {paginaActualGastos} de {totalPaginasGastos}
                        </span>

                        <button
                          type="button"
                          className="paginacion-boton"
                          disabled={paginaActualGastos === totalPaginasGastos}
                          onClick={() =>
                            setPaginaGastos((anterior) =>
                              Math.min(totalPaginasGastos, anterior + 1)
                            )
                          }
                        >
                          Siguiente
                        </button>
                      </div>
                    </nav>
                  )}
              </section>

            )}

            {vistaGastos === "formulario" && (
              <GastoForm
                onVolver={() =>
                  setVistaGastos("listado")
                }
                onGastoRegistrado={manejarGastoRegistrado}
                onSesionExpirada={onLogout}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default FinancePanel;