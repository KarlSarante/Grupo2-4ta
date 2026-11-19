import { useEffect, useState } from "react";
import { obtenerUsuarios } from "../services/adminService.js";

function AdminPanel({ usuario, token, onLogout }) {
  const [usuarios, setUsuarios] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState("usuarios");
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [tipoCategoria, setTipoCategoria] = useState("gasto");
  const [errorNombreCategoria, setErrorNombreCategoria] = useState("");
  const [errorTipoCategoria, setErrorTipoCategoria] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarUsuarios() {
      try {
        const resultado = await obtenerUsuarios(token);

        if (activo) {
          setUsuarios(resultado);
        }
      } catch (err) {
        if (activo) {
          setError(err.message);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarUsuarios();

    return () => {
      activo = false;
    };
  }, [token]);

  function validarNombreCategoria(nombre) {
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      return "El nombre de la categoría es obligatorio";
    }

    if (nombreLimpio.length > 100) {
      return "El nombre no puede superar los 100 caracteres";
    }

    // eslint-disable-next-line no-control-regex -- Validación intencional de caracteres de control.
    if (/[\x00-\x1F\x7F]/.test(nombreLimpio)) {
      return "El nombre contiene caracteres no permitidos";
    }

    return "";
  }

  function validarTipoCategoria(tipo) {
    if (tipo !== "gasto" && tipo !== "ingreso") {
      return "El tipo de categoría debe ser ingreso o gasto";
    }

    return "";
  }

  function manejarEnvioCategoria(evento) {
    evento.preventDefault();

    const errorNombre = validarNombreCategoria(nombreCategoria);
    const errorTipo = validarTipoCategoria(tipoCategoria);

    setErrorNombreCategoria(errorNombre);
    setErrorTipoCategoria(errorTipo);

    if (errorNombre) {
      document.getElementById("nombre-categoria")?.focus();
      return;
    }

    if (errorTipo) {
      document.querySelector(
        'input[name="tipoCategoria"]'
      )?.focus();
      return;
    }

    // La integración con la API se implementará en el #93.
  }

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroRol("todos");
    setFiltroEstado("todos");
  }


  const terminoBusqueda = busqueda.trim().toLocaleLowerCase();

  const usuariosFiltrados = usuarios.filter((cuenta) => {
    const nombre = String(cuenta.nombre ?? "").toLocaleLowerCase();
    const email = String(cuenta.email ?? "").toLocaleLowerCase();

    const coincideBusqueda =
      nombre.includes(terminoBusqueda) ||
      email.includes(terminoBusqueda);

    const coincideRol =
      filtroRol === "todos" || cuenta.rol === filtroRol;

    const coincideEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "activo" && Number(cuenta.activo) === 1) ||
      (filtroEstado === "inactivo" && Number(cuenta.activo) === 0);

    return coincideBusqueda && coincideRol && coincideEstado;
  });


  return (
    <main className="role-panel">
      <section className="role-card admin-card">
        <p className="role-label">Panel administrativo</p>

        <h1>Bienvenido, {usuario.nombre}</h1>

        <p>Gestiona usuarios y categorías de la plataforma.</p>

        <nav className="admin-tabs" aria-label="Secciones administrativas">
          <button
            type="button"
            className={`admin-tab ${pestanaActiva === "usuarios" ? "admin-tab-activa" : ""}`}
            aria-current={pestanaActiva === "usuarios" ? "page" : undefined}
            onClick={() => setPestanaActiva("usuarios")}
          >
            Usuarios registrados
          </button>

          <button
            type="button"
            className={`admin-tab ${pestanaActiva === "categorias" ? "admin-tab-activa" : ""}`}
            aria-current={pestanaActiva === "categorias" ? "page" : undefined}
            onClick={() => setPestanaActiva("categorias")}
          >
            Categorías
          </button>
        </nav>

        {pestanaActiva === "usuarios" && (
          <section className="admin-seccion" aria-label="Gestión de usuarios">

            <h2>Usuarios registrados</h2>

            <div className="usuarios-busqueda">
              <label htmlFor="buscar-usuarios">
                Buscar usuarios
              </label>

              <input
                id="buscar-usuarios"
                type="search"
                placeholder="Buscar por nombre o correo..."
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
              />
            </div>


            <div className="usuarios-filtros">
              <div className="usuarios-filtro">
                <label htmlFor="filtro-rol">Filtrar por rol</label>
                <select
                  id="filtro-rol"
                  value={filtroRol}
                  onChange={(evento) => setFiltroRol(evento.target.value)}
                >
                  <option value="todos">Todos los roles</option>
                  <option value="usuario">Usuario</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              <div className="usuarios-filtro">
                <label htmlFor="filtro-estado">Filtrar por estado</label>
                <select
                  id="filtro-estado"
                  value={filtroEstado}
                  onChange={(evento) => setFiltroEstado(evento.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="usuarios-acciones">
                <button
                  type="button"
                  className="usuarios-limpiar"
                  onClick={limpiarFiltros}
                  disabled={
                    busqueda === "" &&
                    filtroRol === "todos" &&
                    filtroEstado === "todos"
                  }
                >
                  Limpiar filtros
                </button>
              </div>

            </div>


            {cargando && <p>Cargando usuarios...</p>}

            {!cargando && error && (
              <p role="alert">{error}</p>
            )}

            {!cargando && !error && usuarios.length === 0 && (
              <p>No hay usuarios registrados.</p>
            )}

            {!cargando &&
              !error &&
              usuarios.length > 0 &&
              usuariosFiltrados.length === 0 && (
                <p role="status">
                  No se encontraron usuarios con los criterios seleccionados.
                </p>
              )}

            {!cargando && !error && usuarios.length > 0 && (
              <div className="usuarios-tabla-contenedor">
                <table className="usuarios-tabla">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo electrónico</th>
                      <th>Rol</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {usuariosFiltrados.map((cuenta) => (
                      <tr key={cuenta.id}>
                        <td>{cuenta.nombre}</td>
                        <td>{cuenta.email}</td>
                        <td>{cuenta.rol}</td>
                        <td>
                          <span
                            className={`estado-cuenta ${Number(cuenta.activo) === 1
                              ? "estado-activo"
                              : "estado-inactivo"
                              }`}
                          >
                            {Number(cuenta.activo) === 1 ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </section>
        )}

        {pestanaActiva === "categorias" && (
          <section className="admin-seccion" aria-label="Gestión de categorías">
            <h2>Categorías generales</h2>
            <p>
              Consulta las categorías de ingresos y gastos de la plataforma.
            </p>
            <form
              className="categorias-formulario"
              onSubmit={manejarEnvioCategoria}
            >
              <h3>Crear categoría</h3>

              <div className="categorias-campo">
                <label htmlFor="nombre-categoria">Nombre de categoría</label>
                <input
                  id="nombre-categoria"
                  type="text"
                  placeholder={
                    tipoCategoria === "gasto"
                      ? "Ej. Alimentación"
                      : "Ej. Salario"
                  }
                  value={nombreCategoria}
                  onChange={(evento) => {
                    const nuevoNombre = evento.target.value;

                    setNombreCategoria(nuevoNombre);

                    if (errorNombreCategoria) {
                      setErrorNombreCategoria(validarNombreCategoria(nuevoNombre));
                    }
                  }}
                  aria-invalid={Boolean(errorNombreCategoria)}
                  aria-describedby={
                    errorNombreCategoria ? "error-nombre-categoria" : undefined
                  }
                />

                {errorNombreCategoria && (
                  <p
                    id="error-nombre-categoria"
                    className="categorias-error"
                    role="alert"
                  >
                    {errorNombreCategoria}
                  </p>
                )}
              </div>

              <fieldset className="categorias-tipo">
                <legend>Tipo de categoría</legend>

                <label>
                  <input
                    type="radio"
                    name="tipoCategoria"
                    value="gasto"
                    checked={tipoCategoria === "gasto"}
                    onChange={(evento) => {
                      const nuevoTipo = evento.target.value;

                      setTipoCategoria(nuevoTipo);
                      setErrorTipoCategoria(validarTipoCategoria(nuevoTipo));
                    }}
                  />
                  Gasto
                </label>

                <label>
                  <input
                    type="radio"
                    name="tipoCategoria"
                    value="ingreso"
                    checked={tipoCategoria === "ingreso"}
                    onChange={(evento) => {
                      const nuevoTipo = evento.target.value;

                      setTipoCategoria(nuevoTipo);
                      setErrorTipoCategoria(validarTipoCategoria(nuevoTipo));
                    }}
                  />
                  Ingreso
                </label>
              </fieldset>

              {errorTipoCategoria && (
                <p className="categorias-error" role="alert">
                  {errorTipoCategoria}
                </p>
              )}

              <button type="submit">
                Validar categoría
              </button>

              <p className="categorias-aviso">
                La creación de categorías estará disponible al integrar la API.
              </p>
            </form>
          </section>
        )}

        <button type="button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}

export default AdminPanel;
