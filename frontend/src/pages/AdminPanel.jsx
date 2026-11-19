import { useEffect, useState } from "react";
import { obtenerUsuarios } from "../services/adminService.js";

function AdminPanel({ usuario, token, onLogout }) {
  const [usuarios, setUsuarios] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState("usuarios");
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [tipoCategoria, setTipoCategoria] = useState("gasto");
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
              onSubmit={(evento) => evento.preventDefault()}
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
                  onChange={(evento) => setNombreCategoria(evento.target.value)}
                />
              </div>

              <fieldset className="categorias-tipo">
                <legend>Tipo de categoría</legend>

                <label>
                  <input
                    type="radio"
                    name="tipoCategoria"
                    value="gasto"
                    checked={tipoCategoria === "gasto"}
                    onChange={(evento) => setTipoCategoria(evento.target.value)}
                  />
                  Gasto
                </label>

                <label>
                  <input
                    type="radio"
                    name="tipoCategoria"
                    value="ingreso"
                    checked={tipoCategoria === "ingreso"}
                    onChange={(evento) => setTipoCategoria(evento.target.value)}
                  />
                  Ingreso
                </label>
              </fieldset>

              <button type="submit" disabled>
                Crear categoría
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
