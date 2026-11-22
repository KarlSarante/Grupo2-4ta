import "./AdminPanelV12.css";
import { useEffect, useRef, useState } from "react";
import { obtenerUsuarios, desactivarUsuario } from "../services/adminService.js";
import { crearCategoria, desactivarCategoria, obtenerCategorias } from "../services/categoriaService.js";

function AdminPanel({ usuario, token, onLogout }) {
  const [usuarios, setUsuarios] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState(() => {
    const pestañaGuardada = sessionStorage.getItem("fintrack-admin-pestana");

    return pestañaGuardada || "panel";
  });

  const [nombreCategoria, setNombreCategoria] = useState("");
  const [tipoCategoria, setTipoCategoria] = useState("gasto");
  const [errorNombreCategoria, setErrorNombreCategoria] = useState("");
  const [errorTipoCategoria, setErrorTipoCategoria] = useState("");
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [mensajeCategoria, setMensajeCategoria] = useState("");
  // HU-018: Notificación temporal de desactivación.
  const [notificacionDesactivacion, setNotificacionDesactivacion] = useState(null);
  const [errorCreacionCategoria, setErrorCreacionCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const CATEGORIAS_POR_PAGINA = 7;
  const [paginaCategorias, setPaginaCategorias] = useState(1);
  const [vistaCategorias, setVistaCategorias] = useState("listado");
  const referenciaDialogoCategoria = useRef(null);
  const referenciaAbrirCategoria = useRef(null);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [errorListadoCategorias, setErrorListadoCategorias] = useState("");
  const [categoriaPorDesactivar, setCategoriaPorDesactivar] = useState(null);
  const [desactivandoCategoria, setDesactivandoCategoria] = useState(false);
  const [errorDesactivacion, setErrorDesactivacion] = useState("");
  const referenciaDialogoDesactivar = useRef(null);
  const referenciaBotonDesactivar = useRef(null);
  const bloqueoDesactivacion = useRef(false);

  // HU-014: Estados independientes de usuarios.
  const [usuarioPorDesactivar, setUsuarioPorDesactivar] = useState(null);
  const [desactivandoUsuario, setDesactivandoUsuario] = useState(false);
  const [errorDesactivacionUsuario, setErrorDesactivacionUsuario] = useState("");
  const referenciaDialogoDesactivarUsuario = useRef(null);
  const referenciaBotonDesactivarUsuario = useRef(null);
  const bloqueoDesactivacionUsuario = useRef(false);

  // HU-014: Control del diálogo y restauración del foco.
  useEffect(() => {
    if (!usuarioPorDesactivar) return;

    const dialogo = referenciaDialogoDesactivarUsuario.current;
    if (!dialogo) return;

    if (!dialogo.open) dialogo.showModal();

    dialogo.querySelector("button[type='button']")?.focus();

    return () => {
      if (dialogo.open) dialogo.close();
      referenciaBotonDesactivarUsuario.current?.focus();
    };
  }, [usuarioPorDesactivar]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const USUARIOS_POR_PAGINA = 6;
  const [paginaUsuarios, setPaginaUsuarios] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const referenciaPerfil = useRef(null);


  useEffect(() => {
    if (pestanaActiva !== "categorias" || vistaCategorias !== "formulario") return;

    const dialogo = referenciaDialogoCategoria.current;
    if (!dialogo) return;

    if (!dialogo.open) dialogo.showModal();
    dialogo.querySelector("#nombre-categoria")?.focus();

    return () => {
      if (dialogo.open) dialogo.close();
      referenciaAbrirCategoria.current?.focus();
    };
  }, [pestanaActiva, vistaCategorias]);

  function cerrarModalCategoria() {
    if (guardandoCategoria) return;
    setVistaCategorias("listado");
  }
  useEffect(() => {
    sessionStorage.setItem("fintrack-admin-pestana", pestanaActiva);
  }, [pestanaActiva]);

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
        { ...resultado.categoria, activo: true },
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

  useEffect(() => {
    if (!notificacionDesactivacion) return;

    const temporizador = setTimeout(() => {
      setNotificacionDesactivacion(null);
    }, 4000);

    return () => clearTimeout(temporizador);
  }, [notificacionDesactivacion]);
  // HU-018: Confirmación independiente del formulario de creación.
  useEffect(() => {
    if (!categoriaPorDesactivar) return;

    const dialogo = referenciaDialogoDesactivar.current;
    if (!dialogo) return;

    if (!dialogo.open) dialogo.showModal();

    return () => {
      if (dialogo.open) dialogo.close();
      referenciaBotonDesactivar.current?.focus();
    };
  }, [categoriaPorDesactivar]);

  function solicitarDesactivacionCategoria(categoria, evento) {
    if (bloqueoDesactivacion.current || categoria.activo === false ||
        categoria.activo === 0 || categoria.activo === "0") return;

    referenciaBotonDesactivar.current = evento.currentTarget;
    setErrorDesactivacion("");
    setMensajeCategoria("");
    setCategoriaPorDesactivar(categoria);
  }

  function cancelarDesactivacionCategoria() {
    if (bloqueoDesactivacion.current) return;
    setCategoriaPorDesactivar(null);
    setErrorDesactivacion("");
  }

  // HU-014: Solicitar desactivación.
  function solicitarDesactivacionUsuario(cuenta, evento) {
    if (
      bloqueoDesactivacionUsuario.current ||
      cuenta.rol !== "usuario" ||
      Number(cuenta.activo) !== 1
    ) {
      return;
    }

    referenciaBotonDesactivarUsuario.current = evento.currentTarget;
    setErrorDesactivacionUsuario("");
    setUsuarioPorDesactivar(cuenta);
  }

  // HU-014: Cancelar desactivación.
  function cancelarDesactivacionUsuario() {
    if (bloqueoDesactivacionUsuario.current) return;

    setUsuarioPorDesactivar(null);
    setErrorDesactivacionUsuario("");
  }

  // HU-014: Confirmar desactivación.
  async function confirmarDesactivacionUsuario(evento) {
    evento.preventDefault();

    if (
      !usuarioPorDesactivar ||
      bloqueoDesactivacionUsuario.current
    ) {
      return;
    }

    const id = Number(usuarioPorDesactivar.id);

    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      usuarioPorDesactivar.rol !== "usuario" ||
      Number(usuarioPorDesactivar.activo) !== 1
    ) {
      setErrorDesactivacionUsuario(
        "La cuenta seleccionada no puede desactivarse"
      );
      return;
    }

    bloqueoDesactivacionUsuario.current = true;
    setDesactivandoUsuario(true);
    setErrorDesactivacionUsuario("");

    try {
      const resultado = await desactivarUsuario(id, token);

      if (
        Number(resultado.usuario?.id) !== id ||
        resultado.usuario?.activo !== false
      ) {
        throw new Error(
          "El servidor no confirmó la desactivación de la cuenta"
        );
      }

      setUsuarios((anteriores) =>
        anteriores.map((cuenta) =>
          Number(cuenta.id) === id
            ? { ...cuenta, activo: false }
            : cuenta
        )
      );

      setUsuarioPorDesactivar(null);

    } catch (err) {
      setErrorDesactivacionUsuario(
        err.message || "No se pudo desactivar la cuenta"
      );
    } finally {
      bloqueoDesactivacionUsuario.current = false;
      setDesactivandoUsuario(false);
    }
  }
  async function confirmarDesactivacionCategoria(evento) {
    evento.preventDefault();

    if (!categoriaPorDesactivar || bloqueoDesactivacion.current) return;

    const id = Number(categoriaPorDesactivar.id);
    bloqueoDesactivacion.current = true;
    setDesactivandoCategoria(true);
    setErrorDesactivacion("");

    try {
      const resultado = await desactivarCategoria(id, token);

      setCategorias((anteriores) =>
        anteriores.map((categoria) =>
          Number(categoria.id) === id
            ? { ...categoria, activo: false }
            : categoria
        )
      );

      setNotificacionDesactivacion({
        id: Date.now(),
        nombre: categoriaPorDesactivar.nombre,
      });
      setCategoriaPorDesactivar(null);
    } catch (err) {
      setErrorDesactivacion(
        err.message || "No se pudo desactivar la categoría"
      );
    } finally {
      bloqueoDesactivacion.current = false;
      setDesactivandoCategoria(false);
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
    <main className="role-panel fintrack-admin-v12">
      <aside className="fintrack-admin-sidebar" aria-label="Barra lateral administrativa">
        <div className="fintrack-admin-marca">
          <span className="fintrack-admin-marca-icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="15" rx="2" />
              <path d="M3 10h18M7 6V4a2 2 0 0 1 2-2h8" />
              <path d="M16 15h2" />
            </svg>
          </span>
          <strong>Fintrack</strong>
        </div>

        <nav className="fintrack-admin-navegacion" aria-label="Secciones administrativas">
          {[
            { id: "panel", texto: "Home" },
            { id: "usuarios", texto: "Usuarios" },
            { id: "categorias", texto: "Categorías" },
          ].map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              className={`fintrack-admin-nav-boton ${pestanaActiva === opcion.id ? "activo" : ""}`}
              aria-current={pestanaActiva === opcion.id ? "page" : undefined}
              onClick={() => setPestanaActiva(opcion.id)}
            >
              <svg
                className="fintrack-admin-nav-icono"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {opcion.id === "panel" && (
                  <>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </>
                )}
                {opcion.id === "usuarios" && (
                  <>
                    <circle cx="9" cy="8" r="3" />
                    <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
                    <path d="M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1" />
                  </>
                )}
                {opcion.id === "categorias" && (
                  <path d="m12 2 9 5-9 5-9-5 9-5zm-9 10 9 5 9-5M3 17l9 5 9-5" />
                )}
              </svg>
              {opcion.texto}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="fintrack-admin-salir"
          onClick={onLogout}
        >
          <svg
            className="fintrack-admin-nav-icono"
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
      </aside>
      <div className="fintrack-admin-contenido">
        <section className="role-card admin-card">
          {/* Cabecera del panel administrativo. */}
          <header className="admin-cabecera">
            <div className="admin-cabecera-info">
              <h1>
                {pestanaActiva === "categorias"
                  ? "Gestor de Categorías"
                  : pestanaActiva === "usuarios"
                    ? "Gestor de Usuarios"
                    : `Bienvenido, ${usuario.nombre}`}
              </h1>
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


          {pestanaActiva === "panel" && (
            <section
              className="admin-seccion"
              aria-label="Resumen administrativo"
            >
              <h2>Panel administrativo</h2>

            </section>
          )}
          {pestanaActiva === "usuarios" && (
            <section className="admin-seccion fintrack-admin-listado-v12" aria-label="Gestión de usuarios">

              <div className="usuarios-encabezado-v12">
                <h2>Usuarios Registrados</h2>
              </div>

              <div className="usuarios-controles-compactos-v12">
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
                        <th>Acción</th>
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
                          <td>
                            {cuenta.rol === "usuario" &&
                              Number(cuenta.activo) === 1 &&
                              Number(cuenta.id) !== Number(usuario?.id) && (
                                <button
                                  type="button"
                                  className="usuario-desactivar-accion"
                                  onClick={(evento) =>
                                    solicitarDesactivacionUsuario(cuenta, evento)
                                  }
                                  aria-label={`Desactivar cuenta de ${cuenta.nombre}`}
                                >
                                  Desactivar
                                </button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* HU-014: Confirmación de desactivación de usuario. */}
              {usuarioPorDesactivar && (
                <dialog
                  ref={referenciaDialogoDesactivarUsuario}
                  className="fintrack-modal-usuario"
                  aria-label="Confirmar desactivación de cuenta"
                  onCancel={(evento) => {
                    evento.preventDefault();
                    cancelarDesactivacionUsuario();
                  }}
                >
                  <form
                    className="usuario-desactivar-formulario"
                    onSubmit={confirmarDesactivacionUsuario}
                  >
                    <h3>Desactivar cuenta</h3>

                    <p>
                      ¿Deseas desactivar esta cuenta de usuario?
                    </p>

                    <div className="usuario-desactivar-detalle">
                      <p>
                        <strong>Nombre:</strong>{" "}
                        {usuarioPorDesactivar.nombre}
                      </p>
                      <p>
                        <strong>Correo electrónico:</strong>{" "}
                        {usuarioPorDesactivar.email}
                      </p>
                    </div>

                    <p>
                      El usuario perderá el acceso a su cuenta y sus sesiones
                      activas serán invalidadas. Sus datos y su historial
                      financiero se conservarán.
                    </p>

                    {errorDesactivacionUsuario && (
                      <p role="alert" aria-live="assertive">
                        {errorDesactivacionUsuario}
                      </p>
                    )}

                    <div className="usuario-desactivar-botones">
                      <button
                        type="button"
                        className="usuario-desactivar-cancelar"
                        disabled={desactivandoUsuario}
                        onClick={cancelarDesactivacionUsuario}
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        className="usuario-desactivar-confirmar"
                        disabled={desactivandoUsuario}
                      >
                        {desactivandoUsuario
                          ? "Desactivando..."
                          : "Confirmar desactivación"}
                      </button>
                    </div>
                  </form>
                </dialog>
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
            <section className="admin-seccion fintrack-admin-listado-v12" aria-label="Gestión de categorías">
              {/* HU-016: Vista principal del listado de categorías. */}
              {(
                <>
                  <div className="categorias-encabezado">
                    <h2>Categorías Registradas</h2>
                    <button
                      type="button"
                      className="categorias-crear-boton"
                      ref={referenciaAbrirCategoria}
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
                  </div>

                  {notificacionDesactivacion && (
                    <div
                      className="categorias-notificacion-desactivacion"
                      role="status"
                      aria-live="polite"
                    >
                      <span aria-hidden="true" className="categorias-notificacion-icono">
                        ✓
                      </span>
                      <div>
                        <strong>Categoría desactivada</strong>
                        <p>
                          La categoría «{notificacionDesactivacion.nombre}»
                          ya no está disponible para nuevas transacciones.
                          Su historial se conserva.
                        </p>
                      </div>
                    </div>
                  )}
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

                  <div className="fintrack-admin-tabla-panel">
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
                                <th>Estado</th>
                                <th>Acción</th>
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
                                  <td>
                                    <span
                                      className={`estado-cuenta ${
                                        categoria.activo === false ||
                                        categoria.activo === 0 ||
                                        categoria.activo === "0"
                                          ? "estado-inactivo"
                                          : "estado-activo"
                                      }`}
                                    >
                                      {categoria.activo === false ||
                                      categoria.activo === 0 ||
                                      categoria.activo === "0"
                                        ? "Inactiva"
                                        : "Activa"}
                                    </span>
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      className="categoria-estado-accion"
                                      disabled={
                                        categoria.activo === false ||
                                        categoria.activo === 0 ||
                                        categoria.activo === "0" ||
                                        desactivandoCategoria
                                      }
                                      title={
                                        categoria.activo === false ||
                                        categoria.activo === 0 ||
                                        categoria.activo === "0"
                                          ? "Categoría inactiva; reactivación pendiente"
                                          : "Desactivar categoría general"
                                      }
                                      onClick={(evento) =>
                                        solicitarDesactivacionCategoria(categoria, evento)
                                      }
                                    >
                                      {desactivandoCategoria &&
                                      Number(categoriaPorDesactivar?.id) ===
                                        Number(categoria.id)
                                        ? "Desactivando..."
                                        : "Desactivar"}
                                    </button>
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
                  </div>

                </>
              )}

              {categoriaPorDesactivar && (
                <dialog
                  ref={referenciaDialogoDesactivar}
                  className="fintrack-modal-categoria"
                  aria-label="Confirmar desactivación de categoría"
                  onCancel={(evento) => {
                    evento.preventDefault();
                    cancelarDesactivacionCategoria();
                  }}
                >
                  <form
                    className="categorias-formulario"
                    onSubmit={confirmarDesactivacionCategoria}
                  >
                    <h3>Desactivar categoría</h3>
                    <p>
                      ¿Deseas desactivar la categoría
                      {" "}<strong>{categoriaPorDesactivar.nombre}</strong>?
                    </p>
                    <p>
                      Dejará de estar disponible para nuevas transacciones.
                      Los movimientos históricos no se eliminarán.
                    </p>

                    {errorDesactivacion && (
                      <p className="categorias-error" role="alert">
                        {errorDesactivacion}
                      </p>
                    )}

                    <div className="fintrack-modal-categoria-acciones">
                      <button
                        type="button"
                        className="categorias-volver"
                        disabled={desactivandoCategoria}
                        onClick={cancelarDesactivacionCategoria}
                      >
                        Cancelar
                      </button>
                      <button type="submit" disabled={desactivandoCategoria}>
                        {desactivandoCategoria
                          ? "Desactivando..."
                          : "Confirmar desactivación"}
                      </button>
                    </div>
                  </form>
                </dialog>
              )}

              {vistaCategorias === "formulario" && (
                <dialog
                  ref={referenciaDialogoCategoria}
                  className="fintrack-modal-categoria"
                  aria-label="Crear categoría"
                  onCancel={(evento) => {
                    evento.preventDefault();
                    cerrarModalCategoria();
                  }}
                  onClick={(evento) => {
                    if (evento.target !== evento.currentTarget) return;
                    const rect = evento.currentTarget.getBoundingClientRect();
                    const fuera =
                      evento.clientX < rect.left ||
                      evento.clientX > rect.right ||
                      evento.clientY < rect.top ||
                      evento.clientY > rect.bottom;
                    if (fuera) cerrarModalCategoria();
                  }}
                >

                  <form
                    className="categorias-formulario"
                    onSubmit={manejarEnvioCategoria}
                  >
                    <h3>Crear categoría</h3>
                    <button
                      type="button"
                      className="fintrack-modal-categoria-cerrar"
                      aria-label="Cerrar formulario"
                      disabled={guardandoCategoria}
                      onClick={cerrarModalCategoria}
                    >
                      ×
                    </button>

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

                                        <div className="fintrack-modal-categoria-acciones">
                      <button
                        type="button"
                        className="categorias-volver"
                        onClick={cerrarModalCategoria}
                        disabled={guardandoCategoria}
                      >
                        Cancelar
                      </button>
                      <button type="submit" disabled={guardandoCategoria}>
                        {guardandoCategoria ? "Creando categoría..." : "Crear categoría"}
                      </button>
                    </div>

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
                </dialog>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminPanel;
