import { useEffect, useRef, useState } from "react";
import IngresoForm from "./IngresoForm.jsx";
import GastoForm from "./GastoForm.jsx";

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

  // HU005: Vista activa dentro de la pestaña de gastos.
  const [vistaGastos, setVistaGastos] = useState(() => {
    const guardada = sessionStorage.getItem("finanzas-vista-gastos");

    return ["listado", "formulario"].includes(guardada)
      ? guardada
      : "listado";
  });
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const referenciaPerfil = useRef(null);

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
    setPestanaActiva(pestana);
    setVistaIngresos("listado");
    setVistaGastos("listado");
  }

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
                    onClick={() => setVistaIngresos("formulario")}
                  >
                    + Registrar ingreso
                  </button>
                </div>

                <p>
                  El historial de ingresos estará disponible
                  cuando se implemente su consulta.
                </p>
              </section>

            )}

            {vistaIngresos === "formulario" && (
              <IngresoForm
                onVolver={() =>
                  setVistaIngresos("listado")
                }
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

                <p>
                  El historial de gastos estará disponible
                  cuando se implemente su consulta.
                </p>
              </section>
            )}

            {vistaGastos === "formulario" && (
              <GastoForm
                onVolver={() =>
                  setVistaGastos("listado")
                }
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