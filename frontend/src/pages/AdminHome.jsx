import "./AdminHome.css";

const TARJETAS = [
  {
    id: "registrados",
    titulo: "Usuarios registrados",
  },
  {
    id: "administradores",
    titulo: "Administradores",
  },
  {
    id: "usuarios",
    titulo: "Usuarios normales",
  },
  {
    id: "desactivados",
    titulo: "Usuarios desactivados",
  },
];

function normalizarTotal(valor) {
  const numero = Number(valor);

  return Number.isFinite(numero) && numero >= 0
    ? Math.trunc(numero)
    : null;
}

function AdminHome({
  estadisticas = null,
  cargando = false,
  error = "",
  onGestionarUsuarios,
  onGestionarCategorias,
}) {
  const total = normalizarTotal(
    estadisticas?.registrados
  );

  const activos = normalizarTotal(
    estadisticas?.activos
  );

  const inactivos = normalizarTotal(
    estadisticas?.desactivados
  );

  const datosValidos =
    total !== null &&
    activos !== null &&
    inactivos !== null &&
    activos + inactivos === total;

  const porcentajeActivos =
    datosValidos && total > 0
      ? (activos / total) * 100
      : 0;

  const valores = {
    registrados: total,
    administradores: normalizarTotal(
      estadisticas?.administradores
    ),
    usuarios: normalizarTotal(
      estadisticas?.usuarios
    ),
    desactivados: inactivos,
  };

  const mostrarDatos =
    !cargando && !error && datosValidos;

  return (
    <section
      className="fintrack-admin-home"
      aria-label="Resumen administrativo"
    >
      <div className="fintrack-admin-home-intro">
        <h2>Panel administrativo</h2>
        <p>Resumen general de FINTRACK</p>
      </div>

      {error && (
        <p
          className="fintrack-admin-home-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <div
        className="fintrack-admin-home-kpis"
        aria-busy={cargando}
      >
        {TARJETAS.map((tarjeta) => (
          <article
            className="fintrack-admin-home-kpi"
            key={tarjeta.id}
          >
            <span className="fintrack-admin-home-kpi-label">
              {tarjeta.titulo}
            </span>

            <strong className="fintrack-admin-home-kpi-valor">
              {mostrarDatos &&
              valores[tarjeta.id] !== null
                ? valores[tarjeta.id].toLocaleString("es-DO")
                : "—"}
            </strong>
          </article>
        ))}
      </div>

      <div className="fintrack-admin-home-paneles">
        <article className="fintrack-admin-home-panel">
          <h3>Usuarios por estado</h3>

          {cargando ? (
            <p role="status">
              Cargando estadísticas...
            </p>
          ) : error ? (
            <p>
              No se pudieron mostrar las estadísticas.
            </p>
          ) : !datosValidos ? (
            <p>
              No hay estadísticas disponibles.
            </p>
          ) : total === 0 ? (
            <p>
              Todavía no hay cuentas registradas.
            </p>
          ) : (
            <>
              <div className="fintrack-admin-home-grafico">
                <div
                  className="fintrack-admin-home-anillo"
                  style={{
                    "--porcentaje-activos":
                      `${porcentajeActivos}%`,
                  }}
                  role="img"
                  aria-label={
                    `${activos} cuentas activas y ` +
                    `${inactivos} inactivas`
                  }
                >
                  <div className="fintrack-admin-home-centro">
                    <strong>{total}</strong>
                    <span>cuentas</span>
                  </div>
                </div>
              </div>

              <div className="fintrack-admin-home-leyenda">
                <span>
                  <i className="fintrack-admin-home-punto activo" />
                  Activos: {activos}
                </span>

                <span>
                  <i className="fintrack-admin-home-punto inactivo" />
                  Inactivos: {inactivos}
                </span>
              </div>
            </>
          )}
        </article>

        <article className="fintrack-admin-home-panel">
          <h3>Acciones rápidas</h3>

          <div className="fintrack-admin-home-acciones">
            <button
              type="button"
              onClick={onGestionarUsuarios}
              disabled={!onGestionarUsuarios}
            >
              <strong>Gestionar usuarios</strong>
              <span>
                Consultar y administrar cuentas
              </span>
            </button>

            <button
              type="button"
              onClick={onGestionarCategorias}
              disabled={!onGestionarCategorias}
            >
              <strong>Gestionar categorías</strong>
              <span>
                Consultar y administrar categorías
              </span>
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

export default AdminHome;