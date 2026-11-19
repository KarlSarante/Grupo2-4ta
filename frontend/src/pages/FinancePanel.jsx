import { useEffect, useRef, useState } from "react";
import IngresoForm from "./IngresoForm.jsx";
import { obtenerIngresos } from "../services/ingresoService.js";

// HU004 / #64: Panel financiero y navegación visual.
function FinancePanel({ usuario, onLogout }) {
  const [pestanaActiva, setPestanaActiva] = useState(() => {
    const guardada = sessionStorage.getItem("finanzas-pestana");

    return ["resumen", "ingresos", "gastos"].includes(guardada)
      ? guardada
      : "ingresos";
  });

  const [vistaIngresos, setVistaIngresos] = useState(() => {
    const guardada = sessionStorage.getItem("finanzas-vista-ingresos");

    return ["listado", "formulario"].includes(guardada)
      ? guardada
      : "listado";
  });
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const referenciaPerfil = useRef(null);

  // HU004 / #66: Confirmación después de registrar un ingreso.
  const [mensajeIngreso, setMensajeIngreso] = useState("");

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
    setPestanaActiva(pestana);
    setVistaIngresos("listado");
  }

  // HU004 / #66: Regresar al listado despues de agregar un ingreso y actualizar los ingresos.
  function manejarIngresoRegistrado(mensaje) {
    setMensajeIngreso(mensaje || "Ingreso registrado correctamente.");
    setPaginaIngresos(1);
    setRecargaIngresos((anterior) => anterior + 1);
    setPestanaActiva("ingresos");
    setVistaIngresos("listado");
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

        {/* Resumen: pendiente de sus historias de usuario. */}
        {pestanaActiva === "resumen" && (
          <section className="admin-seccion">
            <h2>Resumen financiero</h2>
            <p>
              El resumen mensual se implementará en las
              historias de usuario correspondientes.
            </p>
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
                  <div className="ingresos-listado">
                    {ingresosVisibles.map((ingreso) => {
                      const monto = Number(ingreso.monto);
                      const fecha = String(ingreso.fecha).slice(0, 10);

                      return (
                        <article
                          key={ingreso.id}
                          className="ingresos-item"
                        >
                          <div>
                            <strong>
                              {Number.isFinite(monto)
                                ? monto.toLocaleString("es-DO", {
                                  style: "currency",
                                  currency: "DOP",
                                })
                                : "Monto no disponible"}
                            </strong>

                            <p>
                              Fecha: {fecha}
                            </p>

                            <p>Categoría: {ingreso.categoria_nombre ?? "Sin categoría"}</p>

                            {ingreso.descripcion && (
                              <p>{ingreso.descripcion}</p>
                            )}
                          </div>
                        </article>
                      );
                    })}
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

        {/* Gastos: pendiente de su implementación. */}
        {pestanaActiva === "gastos" && (
          <section className="admin-seccion">
            <h2>Mis gastos</h2>
            <p>
              La gestión de gastos estará disponible cuando
              se implemente su historia de usuario.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

export default FinancePanel;
