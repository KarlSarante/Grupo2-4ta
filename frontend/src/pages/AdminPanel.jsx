import { useEffect, useState } from "react";
import { obtenerUsuarios } from "../services/adminService.js";

function AdminPanel({ usuario, token, onLogout }) {
  const [usuarios, setUsuarios] = useState([]);
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
      <section className="role-card">
        <p className="role-label">Panel administrativo</p>

        <h1>Bienvenido, {usuario.nombre}</h1>

        <p>Consulta las cuentas registradas en la plataforma.</p>

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

        <button type="button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}

export default AdminPanel;
