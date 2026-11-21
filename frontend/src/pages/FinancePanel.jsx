import { useEffect, useMemo, useRef, useState } from "react";
import IngresoForm from "./IngresoForm.jsx";
import GastoForm from "./GastoForm.jsx";
import PresupuestosPanel from "./PresupuestosPanel.jsx";
import MetasFinancierasPanel from "./MetasFinancierasPanel.jsx";
import CategoriasPanel from "./CategoriasPanel.jsx";
import Dashboard from "../components/dashboard/Dashboard.jsx";
import "./FinancePanel.css";
import { obtenerIngresos } from "../services/ingresoService.js";
import { obtenerTransacciones } from "../services/financeService.js";
import {
  consultarLimiteGastos,
  actualizarLimiteGastos,
} from "../services/limiteGastosService.js";
import { obtenerGastos } from "../services/gastoService.js";

// HU004 / #64: Panel financiero y navegación visual.
function FinancePanel({ usuario, token, onLogout }) {
  const [pestanaActiva, setPestanaActiva] = useState(() => {
  const guardada = sessionStorage.getItem("finanzas-pestana");

  return ["resumen", "ingresos", "gastos", "historial", "presupuestos", "metas", "categorias"].includes(guardada)
    ? guardada
    : "resumen";
});

  const [vistaIngresos, setVistaIngresos] = useState("listado");

  // HU005: Vista activa dentro de la pestaña de gastos.
  const [vistaGastos, setVistaGastos] = useState(() => {
    const guardada = sessionStorage.getItem("finanzas-vista-gastos");

    return ["listado", "formulario"].includes(guardada)
      ? guardada
      : "listado";
  });
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [guardandoModalIngreso, setGuardandoModalIngreso] = useState(false);
  const referenciaDialogoIngreso = useRef(null);
  const [guardandoModalGasto, setGuardandoModalGasto] = useState(false);
  const [avisosPresupuesto, setAvisosPresupuesto] = useState([]);
  const [advertenciaPresupuesto, setAdvertenciaPresupuesto] = useState("");
  const referenciaDialogoGasto = useRef(null);
  const referenciaAbrirGasto = useRef(null);
  const referenciaAbrirIngreso = useRef(null);
  const referenciaPerfil = useRef(null);
  // HU006: Historial general de ingresos y gastos.
  const [transacciones, setTransacciones] = useState([]);
  const [cargandoTransacciones, setCargandoTransacciones] = useState(false);
  const [errorTransacciones, setErrorTransacciones] = useState("");
  const [limiteGastos, setLimiteGastos] = useState(null);
  const [cargandoLimite, setCargandoLimite] = useState(false);
  const [errorLimite, setErrorLimite] = useState("");
  // HU006: Paginación del historial general de transacciones.
  const [paginaTransacciones, setPaginaTransacciones] = useState(1);
  const transaccionesPorPagina = 8;
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  });

  // Mes maximo permitido.
  const hoySelector = new Date();
  const mesActual = `${hoySelector.getFullYear()}-${String(
    hoySelector.getMonth() + 1
  ).padStart(2, "0")}`;


  const transaccionesDelMes = useMemo(
    () => transacciones.filter((transaccion) =>
      String(transaccion.fecha ?? "").slice(0, 7) === mesSeleccionado
    ),
    [transacciones, mesSeleccionado]
  );



  useEffect(() => {
    if (!["resumen", "historial"].includes(pestanaActiva)) return;

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
  }, [pestanaActiva, token]);

  // Limite de gastos del usuario autenticado.
  useEffect(() => {
    if (pestanaActiva !== "resumen") return;

    let activo = true;

    async function cargarLimite() {
      setCargandoLimite(true);
      setErrorLimite("");
      setLimiteGastos(null);

      try {
        const limite = await consultarLimiteGastos(token);
        if (activo) setLimiteGastos(limite);
      } catch (error) {
        if (activo) {
          setErrorLimite(
            error.message || "No se pudo consultar el limite de gastos."
          );
        }
      } finally {
        if (activo) setCargandoLimite(false);
      }
    }

    cargarLimite();

    return () => {
      activo = false;
    };
  }, [pestanaActiva, token]);

  async function guardarLimiteGastos(monto) {
    setErrorLimite("");

    try {
      const limite = await actualizarLimiteGastos(monto, token);
      setLimiteGastos(limite);
      return limite;
    } catch (error) {
      setErrorLimite(
        error.message || "No se pudo actualizar el limite de gastos."
      );
      throw error;
    }
  }
  // HU004 / #66: Confirmación después de registrar un ingreso.
  const [mensajeIngreso, setMensajeIngreso] = useState("");
  const [mensajeGasto, setMensajeGasto] = useState("");

  const [gastos, setGastos] = useState([]);
  const [cargandoGastos, setCargandoGastos] = useState(false);
  const [errorGastos, setErrorGastos] = useState("");
  const [recargaGastos, setRecargaGastos] = useState(0);

  // HU005: Paginación del historial de gastos.
  const [paginaGastos, setPaginaGastos] = useState(1);
  const gastosPorPagina = 8;

  // HU004 / #66: Historial de ingresos del usuario autenticado.
  const [ingresos, setIngresos] = useState([]);
  const [cargandoIngresos, setCargandoIngresos] = useState(true);
  const [errorIngresos, setErrorIngresos] = useState("");
  const [recargaIngresos, setRecargaIngresos] = useState(0);

  // HU004 / #66: Paginación del historial de ingresos.
  const [paginaIngresos, setPaginaIngresos] = useState(1);
  const ingresosPorPagina = 8;

  // Conservar la pestaña activa al actualizar la página.
  useEffect(() => {
    sessionStorage.setItem("finanzas-pestana", pestanaActiva);
  }, [pestanaActiva]);

  // El modal no se restaura tras recargar la pagina.
  useEffect(() => {
    sessionStorage.setItem("finanzas-vista-ingresos", "listado");
  }, []);

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

  // Modal nativo: fondo bloqueado y foco dentro del dialogo.
  useEffect(() => {
    if (pestanaActiva !== "ingresos" || vistaIngresos !== "formulario") return;

    const dialogo = referenciaDialogoIngreso.current;
    if (!dialogo) return;

    if (!dialogo.open) dialogo.showModal();

    dialogo.querySelector("#ingreso-monto")?.focus();

    return () => {
      if (dialogo.open) dialogo.close();
      referenciaAbrirIngreso.current?.focus();
    };
  }, [pestanaActiva, vistaIngresos]);

  // Modal Registrar gasto.
  useEffect(() => {
    if (pestanaActiva !== "gastos" || vistaGastos !== "formulario") return;

    const dialogo = referenciaDialogoGasto.current;
    if (!dialogo) return;

    if (!dialogo.open) dialogo.showModal();
    dialogo.querySelector("#gasto-monto")?.focus();

    return () => {
      if (dialogo.open) dialogo.close();
      referenciaAbrirGasto.current?.focus();
    };
  }, [pestanaActiva, vistaGastos]);

  function cerrarModalGasto() {
    if (guardandoModalGasto) return;
    setVistaGastos("listado");
  }
  function cerrarModalIngreso() {
    if (guardandoModalIngreso) return;
    setVistaIngresos("listado");
  }

  function cerrarSesion() {
    sessionStorage.removeItem("finanzas-pestana");
    sessionStorage.removeItem("finanzas-vista-ingresos");
    sessionStorage.removeItem("finanzas-vista-gastos");
    onLogout();
  }

  function abrirHistorialCompleto() {
    setPaginaTransacciones(1);
    cambiarPestana("historial");
  }

  function cambiarPestana(pestana) {
    setMensajeIngreso("");
    setPestanaActiva(pestana);
    setVistaIngresos("listado");
    setVistaGastos("listado");
    setMensajeGasto("");
  }

  // HU004 / #66: Regresar al listado despues de agregar un ingreso y actualizar los ingresos.
  function manejarIngresoRegistrado(mensaje) {
    setGuardandoModalIngreso(false);
    setMensajeIngreso(mensaje || "Ingreso registrado correctamente.");
    setPaginaIngresos(1);
    setRecargaIngresos((anterior) => anterior + 1);
    setPestanaActiva("ingresos");
    setVistaIngresos("listado");
  }

  // HU004 / #66: Regresar al listado despues de agregar un gasto y actualizar los gastos.
  function manejarGastoRegistrado(mensaje, alertas = [], advertencia = "") {
    setAvisosPresupuesto(Array.isArray(alertas) ? alertas : []);
    setAdvertenciaPresupuesto(advertencia);
    setGuardandoModalGasto(false);
    setMensajeGasto(mensaje || "Gasto registrado correctamente.");
    setPestanaActiva("gastos");
    setVistaGastos("listado");
    setRecargaGastos((anterior) => anterior + 1);
    setPaginaGastos(1);
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
  const transaccionesOrdenadas = useMemo(
    () => [...transacciones].sort((a, b) =>
      String(b.fecha ?? "").localeCompare(String(a.fecha ?? ""))
    ),
    [transacciones]
  );

  const totalTransacciones = transaccionesOrdenadas.length;

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

  const transaccionesVisibles = transaccionesOrdenadas.slice(
    indiceInicialTransacciones,
    indiceInicialTransacciones + transaccionesPorPagina
  );

  return (
    <main className="role-panel fintrack-usuario">
      <aside className="fintrack-sidebar" aria-label="Barra lateral de Fintrack">
        <div className="fintrack-marca">
          <span className="fintrack-marca-icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="15" rx="2" />
              <path d="M3 10h18M7 6V4a2 2 0 0 1 2-2h8" />
              <path d="M16 15h2" />
            </svg>
          </span>
          <strong>Fintrack</strong>
        </div>
        <nav
          className="admin-tabs fintrack-navegacion"
          aria-label="Secciones financieras"
        >
          {[
            { id: "resumen", texto: "Home", icono: "home" },
            { id: "ingresos", texto: "Ingresos", icono: "ingresos" },
            { id: "gastos", texto: "Gastos", icono: "gastos" },
            { id: "categorias", texto: "Categorías", icono: "categorias" },
            { id: "presupuestos", texto: "Presupuestos", icono: "presupuestos" },
            { id: "metas", texto: "Meta financiera", icono: "metas" },
          ].map((pestana) => (
            <button
              key={pestana.id}
              type="button"
              disabled={pestana.pendiente === true}
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
              <svg
                className="fintrack-nav-icono"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {pestana.icono === "home" && (
                  <path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z" />
                )}
                {pestana.icono === "ingresos" && (
                  <>
                    <path d="m3 17 7-7 4 4 7-7" />
                    <path d="M15 7h6v6" />
                  </>
                )}
                {pestana.icono === "gastos" && (
                  <path d="M12 3v18m-7-7 7 7 7-7" />
                )}
                {pestana.icono === "categorias" && (
                  <path d="m12 2 9 5-9 5-9-5 9-5zm-9 10 9 5 9-5M3 17l9 5 9-5" />
                )}
                {pestana.icono === "presupuestos" && (
                  <>
                    <rect x="3" y="5" width="18" height="15" rx="2" />
                    <path d="M3 10h18M7 15h4" />
                  </>
                )}
                {pestana.icono === "metas" && (
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="5" />
                    <path d="m12 12 8-8" />
                  </>
                )}
              </svg>
              {pestana.texto}
            </button>
          ))}
          <button
            type="button"
            className="fintrack-cerrar-sesion"
            onClick={cerrarSesion}
          >
            <svg
              className="fintrack-nav-icono"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />
            </svg>
            Cerrar sesión
          </button>
        </nav>
      </aside>
      <section className="role-card admin-card fintrack-contenido">
        {/* Cabecera compartida visualmente con AdminPanel. */}
        <header className="admin-cabecera fintrack-cabecera-v12">
          <div className="admin-cabecera-info">
            <p className="role-label">Resumen financiero</p>
            <h1>{pestanaActiva === "historial" ? "Historial de transacciones" : pestanaActiva === "ingresos" ? "Ingresos" : pestanaActiva === "gastos" ? "Gastos" : pestanaActiva === "presupuestos" ? "Presupuestos" : pestanaActiva === "metas" ? "Meta financiera" : pestanaActiva === "categorias" ? "Categorías" : "Dashboard"}</h1>
            <p>{pestanaActiva === "historial" ? "Consulta todos tus movimientos" : pestanaActiva === "ingresos" ? "Consulta tus ingresos registrados" : pestanaActiva === "gastos" ? "Consulta tus gastos registrados" : pestanaActiva === "presupuestos" ? "Administra tus presupuestos mensuales por categoría" : pestanaActiva === "metas" ? "Consulta tus objetivos de ahorro y aportaciones" : pestanaActiva === "categorias" ? "Administra tus categorías de ingresos y gastos" : "Control de tus finanzas personales"}</p>
          </div>
          {pestanaActiva === "resumen" && (
          <div className="fintrack-selector-mes">
            {/* SELECTOR VISUAL */}
            <button
              type="button"
              className="fintrack-selector-mes-boton"
              onClick={() => {
                const input = document.getElementById("fintrack-mes");
                try {
                  input?.showPicker();
                } catch {
                  input?.focus();
                }
              }}
              aria-label="Seleccionar mes del resumen financiero"
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M7 3v4M17 3v4M3 10h18" />
              </svg>
              <span className="fintrack-selector-mes-texto">
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(`${mesSeleccionado}-01T12:00:00Z`))}
              </span>
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <input
              id="fintrack-mes"
              type="month"
              lang="es"
              max={mesActual}
              value={mesSeleccionado}
              onChange={(evento) => {
                const nuevoMes = evento.target.value;
                if (nuevoMes && nuevoMes <= mesActual) {
                  setMesSeleccionado(nuevoMes);
                }
              }}
              tabIndex={-1}
              aria-hidden="true"
              className="fintrack-selector-mes-input"
            />
          </div>
          )}

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
                  onClick={cerrarSesion}
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


        {pestanaActiva === "resumen" && (
          <Dashboard
            transacciones={[...transaccionesDelMes].sort((a, b) =>
              String(b.fecha ?? "").localeCompare(String(a.fecha ?? ""))
            )}
            transaccionesHistoricas={transacciones}
            mesSeleccionado={mesSeleccionado}
            limiteGastos={limiteGastos}
            cargandoLimite={cargandoLimite}
            errorLimite={errorLimite}
            onGuardarLimite={guardarLimiteGastos}
            cargando={cargandoTransacciones}
            error={errorTransacciones}
            onVerHistorial={abrirHistorialCompleto}
          />
        )}

        {pestanaActiva === "historial" && (
          <section className="admin-seccion historial-seccion">

            {cargandoTransacciones ? (
              <p role="status">Cargando transacciones...</p>
            ) : errorTransacciones ? (
              <p role="alert" className="historial-error">
                {errorTransacciones}
              </p>
            ) : totalTransacciones === 0 ? (
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
                  className="usuarios-paginacion ingresos-paginacion fintrack-historial-paginacion" aria-label="Paginación de transacciones"
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
        {/* HU004 / #64: Registro de ingresos. */}
        {pestanaActiva === "ingresos" && (
          <>
            {(

              <section className="admin-seccion fintrack-ingresos-v12">
                <div className="ingresos-encabezado">
                  <h2>Mis ingresos</h2>

                  <button
                    type="button"
                    className="categorias-crear-boton"
                    ref={referenciaAbrirIngreso}
                    onClick={() => {
                      setMensajeIngreso("");
                      setGuardandoModalIngreso(false);
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
                      className="usuarios-paginacion ingresos-paginacion fintrack-ingresos-paginacion" aria-label="Paginación de ingresos"
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
              <dialog
                ref={referenciaDialogoIngreso}
                className="fintrack-modal-ingreso"
                aria-label="Registrar ingreso"
                onClick={(evento) => {
                  if (evento.target !== evento.currentTarget) return;

                  const rectangulo =
                    evento.currentTarget.getBoundingClientRect();

                  const fuera =
                    evento.clientX < rectangulo.left ||
                    evento.clientX > rectangulo.right ||
                    evento.clientY < rectangulo.top ||
                    evento.clientY > rectangulo.bottom;

                  if (fuera) cerrarModalIngreso();
                }}
                onCancel={(evento) => {
                  evento.preventDefault();
                  cerrarModalIngreso();
                }}
              >
                <button
                  type="button"
                  className="fintrack-modal-ingreso-cerrar"
                  aria-label="Cerrar formulario de ingreso"
                  disabled={guardandoModalIngreso}
                  onClick={cerrarModalIngreso}
                >
                  ×
                </button>
                <IngresoForm
                  onVolver={cerrarModalIngreso}
                  onIngresoRegistrado={manejarIngresoRegistrado}
                  onEstadoGuardando={setGuardandoModalIngreso}
                />
              </dialog>
            )}
          </>
        )}

        {/* HU005: Registro de gastos. */}
        {pestanaActiva === "gastos" && (
          <>
            {vistaGastos === "listado" && (
              <section className="admin-seccion fintrack-gastos-v12">
                <div className="ingresos-encabezado">
                  <h2>Mis gastos</h2>

                  <button
                    type="button"
                    className="categorias-crear-boton"
                    ref={referenciaAbrirGasto}
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
                {avisosPresupuesto.length > 0 && (
                  <div role="alert" aria-label="Alertas de presupuesto">
                    {avisosPresupuesto.map((alerta, indice) => (
                      <p className="ingresos-mensaje-exito" key={`${alerta.mes}-${alerta.nivel}-${indice}`}>
                        {`Alerta: alcanzaste el ${alerta.nivel}% de tu presupuesto mensual.`}
                      </p>
                    ))}
                  </div>
                )}
                {advertenciaPresupuesto && (
                  <p role="alert">{advertenciaPresupuesto}</p>
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
                      className="usuarios-paginacion ingresos-paginacion fintrack-gastos-paginacion"
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
              <dialog
                ref={referenciaDialogoGasto}
                className="fintrack-modal-gasto"
                aria-label="Registrar gasto"
                onClick={(evento) => {
                  if (evento.target !== evento.currentTarget) return;

                  const rectangulo =
                    evento.currentTarget.getBoundingClientRect();

                  const fuera =
                    evento.clientX < rectangulo.left ||
                    evento.clientX > rectangulo.right ||
                    evento.clientY < rectangulo.top ||
                    evento.clientY > rectangulo.bottom;

                  if (fuera) cerrarModalGasto();
                }}
                onCancel={(evento) => {
                  evento.preventDefault();
                  cerrarModalGasto();
                }}
              >
                <button
                  type="button"
                  className="fintrack-modal-gasto-cerrar"
                  aria-label="Cerrar formulario de gasto"
                  disabled={guardandoModalGasto}
                  onClick={cerrarModalGasto}
                >
                  ×
                </button>
                <GastoForm
                  onVolver={cerrarModalGasto}
                  onGastoRegistrado={manejarGastoRegistrado}
                  onSesionExpirada={onLogout}
                  onEstadoGuardando={setGuardandoModalGasto}
                />
              </dialog>
            )}
          </>
        )}
        {pestanaActiva === "categorias" && (
          <CategoriasPanel token={token} />
        )}
        {pestanaActiva === "presupuestos" && (
          <PresupuestosPanel token={token} />
        )}

        {pestanaActiva === "metas" && (
          <MetasFinancierasPanel />
        )}
      </section>
    </main>
  );
}

export default FinancePanel;
