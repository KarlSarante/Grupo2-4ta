import { useEffect, useRef, useState } from "react"; import { obtenerUsuarios } from "../services/adminService.js";
import { crearCategoria, obtenerCategorias } from "../services/categoriaService.js";

function AdminPanel({ usuario, token, onLogout }) {
  const [usuarios, setUsuarios] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState("usuarios");
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [tipoCategoria, setTipoCategoria] = useState("gasto");
  const [errorNombreCategoria, setErrorNombreCategoria] = useState("");
  const [errorTipoCategoria, setErrorTipoCategoria] = useState("");
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [mensajeCategoria, setMensajeCategoria] = useState("");
  const [errorCreacionCategoria, setErrorCreacionCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const CATEGORIAS_POR_PAGINA = 10;
  const [paginaCategorias, setPaginaCategorias] = useState(1);
  const [vistaCategorias, setVistaCategorias] = useState("listado");
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [errorListadoCategorias, setErrorListadoCategorias] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const USUARIOS_POR_PAGINA = 10;
  const [paginaUsuarios, setPaginaUsuarios] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const referenciaPerfil = useRef(null);

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

  // HU-016: Consultar categorías al abrir su pestaña.
  useEffect(() => {
    if (pestanaActiva !== "categorias") {
      return;
    }

    let activo = true;

    async function cargarCategorias() {
      setCargandoCategorias(true);
      setErrorListadoCategorias("");

      try {
        const resultado = await obtenerCategorias(token);

        if (activo) {
          setCategorias(resultado);
        }
      } catch (err) {
        if (activo) {
          setErrorListadoCategorias(
            err.message || "No se pudieron cargar las categorías"
          );
        }
      } finally {
        if (activo) {
          setCargandoCategorias(false);
        }
      }
    }

    cargarCategorias();

    return () => {
      activo = false;
    };
  }, [pestanaActiva, token]);

  /**
 * Cierra el menú de perfil cuando:
 * - Se hace clic fuera del contenedor.
 * - Se presiona la tecla Escape.
 */
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

  async function manejarEnvioCategoria(evento) {
    evento.preventDefault();

    if (guardandoCategoria) {
      return;
    }

    setMensajeCategoria("");
    setErrorCreacionCategoria("");

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

    setGuardandoCategoria(true);

    try {
      const resultado = await crearCategoria(
        {
          nombre: nombreCategoria.trim(),
          tipo: tipoCategoria,
        },
        token
      );

      // Incorporar la categoría creada al listado actual.
      setCategorias((anteriores) => [
        ...anteriores,
        resultado.categoria,
      ]);

      // Mostrar la confirmación en el listado.
      setMensajeCategoria(
        resultado.mensaje || "Categoría creada correctamente"
      );

      // Restablecer el formulario.
      setNombreCategoria("");
      setTipoCategoria("gasto");
      setErrorNombreCategoria("");
      setErrorTipoCategoria("");

      // Regresar automáticamente al listado.
      setVistaCategorias("listado");
    } catch (err) {
      setErrorCreacionCategoria(
        err.message || "No se pudo crear la categoría"
      );
    } finally {
      setGuardandoCategoria(false);
    }
  }

  // Restablece la búsqueda, los filtros y la página actual.
  function limpiarFiltros() {
    setBusqueda("");
    setFiltroRol("todos");
    setFiltroEstado("todos");
    setPaginaUsuarios(1);
  }

  // Calcula el número total de páginas del listado de categorías.
  const totalPaginasCategorias = Math.max(
    1,
    Math.ceil(categorias.length / CATEGORIAS_POR_PAGINA)
  );

  // Evita mostrar una página inexistente si cambia el total de categorías.
  const paginaActualCategorias = Math.min(
    paginaCategorias,
    totalPaginasCategorias
  );

  // Calcula el índice inicial de las categorías de la página actual.
  const indiceInicialCategorias =
    (paginaActualCategorias - 1) * CATEGORIAS_POR_PAGINA;

  // Obtiene únicamente las categorías de la página seleccionada.
  const categoriasPaginadas = categorias.slice(
    indiceInicialCategorias,
    indiceInicialCategorias + CATEGORIAS_POR_PAGINA
  );

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

  // Calcula la cantidad total de páginas según los usuarios filtrados.
  const totalPaginasUsuarios = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA)
  );

  // Evita mostrar una página inexistente si disminuye el número de resultados.
  const paginaActualUsuarios = Math.min(
    paginaUsuarios,
    totalPaginasUsuarios
  );

  // Calcula la posición inicial de los usuarios de la página actual.
  const indiceInicialUsuarios =
    (paginaActualUsuarios - 1) * USUARIOS_POR_PAGINA;

  // Obtiene únicamente los usuarios correspondientes a la página actual.
  const usuariosPaginados = usuariosFiltrados.slice(
    indiceInicialUsuarios,
    indiceInicialUsuarios + USUARIOS_POR_PAGINA
  );

  return (
    <main className="role-panel">
      <section className="role-card admin-card">
        {/* Cabecera del panel administrativo. */}
        <header className="admin-cabecera">
          <div className="admin-cabecera-info">
            <p className="role-label">Panel administrativo</p>

            <h1>Bienvenido, {usuario.nombre}</h1>

            <p>Gestiona usuarios y categorías de la plataforma.</p>
          </div>

          <div className="admin-perfil" ref={referenciaPerfil}>
            <button
              type="button"
              className="admin-perfil-boton"
              aria-label="Abrir menú de usuario"
              aria-expanded={menuPerfilAbierto}
              aria-controls="admin-menu-perfil"
              onClick={() => setMenuPerfilAbierto((anterior) => !anterior)}
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
                id="admin-menu-perfil"
                className="admin-perfil-menu"
              >
                <div className="admin-perfil-info">
                  <strong>{usuario.nombre}</strong>
                  <span>Administrador</span>
                </div>

                <button
                  type="button"
                  className="admin-perfil-salir"
                  onClick={onLogout}
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
                onChange={(evento) => {
                  setBusqueda(evento.target.value);
                  setPaginaUsuarios(1);
                }}
              />
            </div>


            <div className="usuarios-filtros">
              <div className="usuarios-filtro">
                <label htmlFor="filtro-rol">Filtrar por rol</label>
                <select
                  id="filtro-rol"
                  value={filtroRol}
                  onChange={(evento) => {
                    setFiltroRol(evento.target.value);
                    setPaginaUsuarios(1);
                  }}
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
                  onChange={(evento) => {
                    setFiltroEstado(evento.target.value);
                    setPaginaUsuarios(1);
                  }}
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
                    {usuariosPaginados.map((cuenta) => (
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

            {/* Navegación y resumen del listado de usuarios. */}
            {!cargando && !error && usuariosFiltrados.length > 0 && (
              <nav
                className="usuarios-paginacion"
                aria-label="Paginación de usuarios"
              >
                <span className="paginacion-resumen">
                  Mostrando {indiceInicialUsuarios + 1}–
                  {Math.min(
                    indiceInicialUsuarios + USUARIOS_POR_PAGINA,
                    usuariosFiltrados.length
                  )} de {usuariosFiltrados.length} usuarios
                </span>

                <div className="paginacion-controles">
                  <button
                    type="button"
                    className="paginacion-boton"
                    disabled={paginaActualUsuarios === 1}
                    onClick={() => setPaginaUsuarios(paginaActualUsuarios - 1)}
                  >
                    Anterior
                  </button>

                  <span className="paginacion-indicador" aria-live="polite">
                    {paginaActualUsuarios} de {totalPaginasUsuarios}
                  </span>

                  <button
                    type="button"
                    className="paginacion-boton"
                    disabled={paginaActualUsuarios === totalPaginasUsuarios}
                    onClick={() => setPaginaUsuarios(paginaActualUsuarios + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </nav>
            )}

          </section>
        )}

        {pestanaActiva === "categorias" && (
          <section className="admin-seccion" aria-label="Gestión de categorías">
            {/* HU-016: Vista principal del listado de categorías. */}
            {vistaCategorias === "listado" && (
              <>
                <div className="categorias-encabezado">
                </div>

                <button
                  type="button"
                  className="categorias-crear-boton"
                  onClick={() => {
                    setMensajeCategoria("");
                    setErrorCreacionCategoria("");
                    setErrorNombreCategoria("");
                    setErrorTipoCategoria("");
                    setNombreCategoria("");
                    setTipoCategoria("gasto");
                    setVistaCategorias("formulario");
                  }}
                >
                  + Crear categoría
                </button>

                {mensajeCategoria && (
                  <p className="categorias-exito" role="status">
                    {mensajeCategoria}
                  </p>
                )}

                {cargandoCategorias && <p>Cargando categorías...</p>}

                {!cargandoCategorias && errorListadoCategorias && (
                  <p className="categorias-error" role="alert">
                    {errorListadoCategorias}
                  </p>
                )}

                {!cargandoCategorias &&
                  !errorListadoCategorias &&
                  categorias.length === 0 && (
                    <p>No hay categorías registradas.</p>
                  )}

                {!cargandoCategorias &&
                  !errorListadoCategorias &&
                  categorias.length > 0 && (
                    <div className="usuarios-tabla-contenedor">
                      <table className="usuarios-tabla">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Tipo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoriasPaginadas.map((categoria) => (
                            <tr key={categoria.id}>
                              <td>{categoria.id}</td>
                              <td>{categoria.nombre}</td>
                              <td>
                                {categoria.tipo === "gasto" ? "Gasto" : "Ingreso"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                {/* Navegación y resumen del listado de categorías. */}
                {!cargandoCategorias &&
                  !errorListadoCategorias &&
                  categorias.length > 0 && (
                    <nav
                      className="usuarios-paginacion"
                      aria-label="Paginación de categorías"
                    >
                      <span className="paginacion-resumen">
                        Mostrando {indiceInicialCategorias + 1}–
                        {Math.min(
                          indiceInicialCategorias + CATEGORIAS_POR_PAGINA,
                          categorias.length
                        )} de {categorias.length} categorías
                      </span>

                      <div className="paginacion-controles">
                        <button
                          type="button"
                          className="paginacion-boton"
                          disabled={paginaActualCategorias === 1}
                          onClick={() =>
                            setPaginaCategorias(paginaActualCategorias - 1)
                          }
                        >
                          Anterior
                        </button>

                        <span className="paginacion-indicador" aria-live="polite">
                          {paginaActualCategorias} de {totalPaginasCategorias}
                        </span>

                        <button
                          type="button"
                          className="paginacion-boton"
                          disabled={
                            paginaActualCategorias === totalPaginasCategorias
                          }
                          onClick={() =>
                            setPaginaCategorias(paginaActualCategorias + 1)
                          }
                        >
                          Siguiente
                        </button>
                      </div>
                    </nav>
                  )}

              </>
            )}

            {vistaCategorias === "formulario" && (
              <>
                <button
                  type="button"
                  className="categorias-volver"
                  onClick={() => setVistaCategorias("listado")}
                  disabled={guardandoCategoria}
                >
                  ← Volver a categorías
                </button>

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

                  <button type="submit" disabled={guardandoCategoria}>
                    {guardandoCategoria ? "Creando categoría..." : "Crear categoría"}
                  </button>

                  {mensajeCategoria && (
                    <p className="categorias-exito" role="status">
                      {mensajeCategoria}
                    </p>
                  )}

                  {errorCreacionCategoria && (
                    <p className="categorias-error" role="alert">
                      {errorCreacionCategoria}
                    </p>
                  )}
                </form>
              </>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

export default AdminPanel;
