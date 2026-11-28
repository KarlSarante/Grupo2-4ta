import { useEffect, useRef, useState } from "react";
import {
  actualizarCategoriaPersonal,
  crearCategoria,
  desactivarCategoria,
  obtenerCategorias,
  reactivarCategoriaPersonal,
} from "../services/categoriaService.js";
import "./CategoriasPanel.css";

const filtros = [
  { id: "todas", texto: "Todas" },
  { id: "gasto", texto: "Gastos" },
  { id: "ingreso", texto: "Ingresos" },
];

function contieneCaracteresDeControl(valor) {
  return Array.from(valor).some((caracter) => {
    const codigo = caracter.charCodeAt(0);
    return codigo <= 31 || codigo === 127;
  });
}

function categoriaInactiva(categoria) {
  return (
    categoria.activo === false ||
    categoria.activo === 0 ||
    categoria.activo === "0"
  );
}

export default function CategoriasPanel({ token }) {
  const [categorias, setCategorias] = useState([]);
  const [filtro, setFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [origen, setOrigen] = useState("todas");
  const [paginaCategorias, setPaginaCategorias] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("gasto");
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [categoriaEnEdicion, setCategoriaEnEdicion] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const [categoriaPorReactivar, setCategoriaPorReactivar] = useState(null);
  const [reactivando, setReactivando] = useState(false);
  const [errorReactivacion, setErrorReactivacion] = useState("");
  const [categoriaPorDesactivar, setCategoriaPorDesactivar] = useState(null);
  const [desactivando, setDesactivando] = useState(false);
  const [errorDesactivacion, setErrorDesactivacion] = useState("");
  const dialogo = useRef(null);
  const dialogoReactivacion = useRef(null);
  const botonReactivacion = useRef(null);
  const dialogoDesactivacion = useRef(null);
  const botonDesactivacion = useRef(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setErrorCarga("");

    obtenerCategorias(token, null, true)
      .then((datos) => {
        if (vigente) setCategorias(datos);
      })
      .catch((error) => {
        if (vigente) {
          setErrorCarga(
            error.message || "No se pudieron cargar las categorías."
          );
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [token, recarga]);

  function abrir() {
    setCategoriaEnEdicion(null);
    setNombre("");
    setTipo("gasto");
    setErrorFormulario("");
    setErroresCampos({});
    setMensaje("");
    dialogo.current?.showModal();
  }

  function abrirEdicion(categoria) {
    setCategoriaEnEdicion(categoria);
    setNombre(categoria.nombre);
    setTipo(categoria.tipo);
    setErrorFormulario("");
    setErroresCampos({});
    setMensaje("");
    dialogo.current?.showModal();
  }

  function cerrar() {
    if (guardando) return;
    dialogo.current?.close();
    setErrorFormulario("");
    setErroresCampos({});
    setCategoriaEnEdicion(null);
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (guardando) return;

    const limpio = nombre.trim();
    const errores = {};

    if (!limpio) {
      errores.nombre = "El nombre de la categoría es obligatorio.";
    } else if (limpio.length > 100) {
      errores.nombre = "El nombre no puede superar los 100 caracteres.";
    } else if (contieneCaracteresDeControl(limpio)) {
      errores.nombre = "El nombre contiene caracteres no permitidos.";
    }

    if (!["ingreso", "gasto"].includes(tipo)) {
      errores.tipo = "Selecciona Ingreso o Gasto.";
    }

    if (Object.keys(errores).length > 0) {
      setErroresCampos(errores);
      setErrorFormulario("");
      return;
    }

    setGuardando(true);
    setErrorFormulario("");
    setErroresCampos({});

    try {
      if (categoriaEnEdicion) {
        const resultado = await actualizarCategoriaPersonal(
          categoriaEnEdicion.id,
          { nombre: limpio, tipo },
          token
        );

        setCategorias((actuales) =>
          actuales.map((categoria) =>
            categoria.id === categoriaEnEdicion.id
              ? resultado.categoria
              : categoria
          )
        );
        setMensaje("Categoría actualizada correctamente.");
      } else {
        await crearCategoria({ nombre: limpio, tipo }, token);
        setMensaje("Categoría creada correctamente.");
        setPaginaCategorias(1);
        setRecarga((valor) => valor + 1);
      }

      dialogo.current?.close();
      setCategoriaEnEdicion(null);
    } catch (error) {
      const erroresServidor = Array.isArray(error.errores)
        ? error.errores
        : [];
      const erroresPorCampo = Object.fromEntries(
        erroresServidor
          .filter((item) => ["nombre", "tipo"].includes(item.campo))
          .map((item) => [item.campo, item.mensaje])
      );

      setErroresCampos(erroresPorCampo);
      setErrorFormulario(
        Object.keys(erroresPorCampo).length > 0
          ? ""
          : error.message ||
            `No se pudo ${categoriaEnEdicion ? "actualizar" : "crear"} la categoría.`
      );
    } finally {
      setGuardando(false);
    }
  }

  function confirmarAperturaReactivacion(categoria, boton) {
    setCategoriaPorReactivar(categoria);
    setErrorReactivacion("");
    botonReactivacion.current = boton;
    dialogoReactivacion.current?.showModal();
  }

  async function reactivarCategoria(evento) {
    evento.preventDefault();
    if (!categoriaPorReactivar || reactivando) return;

    setReactivando(true);
    setErrorReactivacion("");

    try {
      await reactivarCategoriaPersonal(categoriaPorReactivar.id, token);

      setCategorias((actuales) =>
        actuales.map((categoria) =>
          categoria.id === categoriaPorReactivar.id
            ? { ...categoria, activo: true }
            : categoria
        )
      );
      setMensaje("Categoría reactivada correctamente.");
      dialogoReactivacion.current?.close();
    } catch (error) {
      setErrorReactivacion(
        error.message || "No se pudo reactivar la categoría."
      );
    } finally {
      setReactivando(false);
    }
  }

  function confirmarAperturaDesactivacion(categoria, boton) {
    setCategoriaPorDesactivar(categoria);
    setErrorDesactivacion("");
    botonDesactivacion.current = boton;
    dialogoDesactivacion.current?.showModal();
  }

  async function desactivarCategoriaSeleccionada(evento) {
    evento.preventDefault();
    if (!categoriaPorDesactivar || desactivando) return;

    setDesactivando(true);
    setErrorDesactivacion("");

    try {
      await desactivarCategoria(categoriaPorDesactivar.id, token);

      setCategorias((actuales) =>
        actuales.map((categoria) =>
          categoria.id === categoriaPorDesactivar.id
            ? { ...categoria, activo: false }
            : categoria
        )
      );
      setMensaje("Categoría desactivada correctamente.");
      dialogoDesactivacion.current?.close();
    } catch (error) {
      setErrorDesactivacion(
        error.message || "No se pudo desactivar la categoría."
      );
    } finally {
      setDesactivando(false);
    }
  }

  const normalizar = (valor) =>
    String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .trim();

  const busquedaNormalizada = normalizar(busqueda);

  const visibles = categorias.filter((categoria) => {
    const coincideTipo =
      filtro === "todas" || categoria.tipo === filtro;

    const esGeneral = categoria.usuario_id == null;
    const coincideOrigen =
      origen === "todas" ||
      (origen === "general" && esGeneral) ||
      (origen === "personal" && !esGeneral);

    const coincideBusqueda = normalizar(
      categoria.nombre
    ).includes(busquedaNormalizada);

    return coincideTipo && coincideOrigen && coincideBusqueda;
  });

  const categoriasPorPagina = 6;
  const totalCategorias = visibles.length;
  const totalPaginasCategorias = Math.max(
    1,
    Math.ceil(totalCategorias / categoriasPorPagina)
  );
  const paginaActualCategorias = Math.min(
    Math.max(1, paginaCategorias),
    totalPaginasCategorias
  );
  const indiceInicialCategorias =
    (paginaActualCategorias - 1) * categoriasPorPagina;
  const categoriasVisibles = visibles.slice(
    indiceInicialCategorias,
    indiceInicialCategorias + categoriasPorPagina
  );

  return (
    <section
      className="fintrack-categorias"
      aria-label="Categorías"
    >
      <div className="fintrack-categorias-cabecera">
        <div>
          <p>
            Organiza tus ingresos y gastos con categorías
            generales y personales.
          </p>
        </div>

        <button
          type="button"
          className="fintrack-categorias-primario"
          onClick={abrir}
        >
          + Nueva categoría
        </button>
      </div>

      {mensaje && (
        <p className="fintrack-categorias-exito" role="status">
          {mensaje}
        </p>
      )}

      <div className="fintrack-categorias-controles">
        <label
          className="fintrack-categorias-busqueda"
          htmlFor="fintrack-categorias-buscar"
        >
          Buscar categorías
        </label>
        <input
          id="fintrack-categorias-buscar"
          type="search"
          placeholder="Buscar categoría..."
          value={busqueda}
          onChange={(evento) => {
            setBusqueda(evento.target.value);
            setPaginaCategorias(1);
          }}
        />

        <label
          className="fintrack-categorias-tipo-etiqueta"
          htmlFor="fintrack-categorias-tipo"
        >
          Tipo
        </label>
        <select
          id="fintrack-categorias-tipo"
          value={filtro}
          onChange={(evento) => {
            setFiltro(evento.target.value);
            setPaginaCategorias(1);
          }}
        >
          {filtros.map((opcion) => (
            <option key={opcion.id} value={opcion.id}>
              {opcion.texto}
            </option>
          ))}
        </select>

        <label
          className="fintrack-categorias-origen-etiqueta"
          htmlFor="fintrack-categorias-origen"
        >
          Origen
        </label>
        <select
          id="fintrack-categorias-origen"
          value={origen}
          onChange={(evento) => {
            setOrigen(evento.target.value);
            setPaginaCategorias(1);
          }}
        >
          <option value="todas">General y personal</option>
          <option value="general">General</option>
          <option value="personal">Personal</option>
        </select>
      </div>

      <div className="fintrack-categorias-tarjeta">
        {!cargando && !errorCarga && (
          <p className="fintrack-categorias-contador" role="status">
            {visibles.length} {visibles.length === 1
              ? "categoría encontrada"
              : "categorías encontradas"}
          </p>
        )}

        {cargando ? (
          <p
            role="status"
            className="fintrack-categorias-estado"
          >
            Cargando categorías...
          </p>
        ) : errorCarga ? (
          <div
            className="fintrack-categorias-estado"
            role="alert"
          >
            <p>{errorCarga}</p>
            <button
              type="button"
              onClick={() =>
                setRecarga((valor) => valor + 1)
              }
            >
              Reintentar
            </button>
          </div>
        ) : visibles.length === 0 ? (
          <p className="fintrack-categorias-estado">
            No hay categorías para este filtro.
          </p>
        ) : (
          <ul className="fintrack-categorias-lista">
            <li className="fintrack-categorias-columnas" aria-hidden="true">
              <span>Descripción</span>
              <span>Estado</span>
              <span>Tipo</span>
              <span>Acciones</span>
            </li>
            {categoriasVisibles.map((categoria) => (
              <li key={categoria.id}>
                <div className="fintrack-categorias-identidad">
                  <strong>{categoria.nombre}</strong>
                  <span>
                    {categoria.usuario_id == null
                      ? "General"
                      : "Personal"}
                  </span>
                </div>

                <span
                  className={
                    `fintrack-categorias-estado-categoria ` +
                    (categoriaInactiva(categoria) ? "inactivo" : "activo")
                  }
                >
                  {categoriaInactiva(categoria) ? "Inactivo" : "Activo"}
                </span>

                <span
                  className={
                    `fintrack-categorias-tipo ` +
                    `fintrack-categorias-tipo-${categoria.tipo}`
                  }
                >
                  {categoria.tipo === "ingreso"
                    ? "Ingreso"
                    : "Gasto"}
                </span>
                <div className="fintrack-categorias-acciones-lista">
                  {categoria.usuario_id != null && (
                    <>
                      {categoriaInactiva(categoria) && (
                        <button
                          type="button"
                          className="fintrack-categorias-activar"
                          onClick={(evento) =>
                            confirmarAperturaReactivacion(
                              categoria,
                              evento.currentTarget
                            )
                          }
                        >
                          Activar
                        </button>
                      )}
                      {!categoriaInactiva(categoria) && (
                        <button
                          type="button"
                          className="fintrack-categorias-desactivar"
                          onClick={(evento) =>
                            confirmarAperturaDesactivacion(
                              categoria,
                              evento.currentTarget
                            )
                          }
                        >
                          Desactivar
                        </button>
                      )}
                      <button
                        type="button"
                        className="fintrack-categorias-editar"
                        onClick={() => abrirEdicion(categoria)}
                      >
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {!cargando &&
          !errorCarga &&
          totalCategorias > categoriasPorPagina && (
            <nav
              className="fintrack-categorias-paginacion"
              aria-label="Paginación de categorías"
            >
              <p className="paginacion-resumen">
                Mostrando {indiceInicialCategorias + 1}–
                {Math.min(
                  indiceInicialCategorias + categoriasPorPagina,
                  totalCategorias
                )} de {totalCategorias} categorías
              </p>

              <div className="paginacion-controles">
                <button
                  type="button"
                  className="paginacion-boton"
                  disabled={paginaActualCategorias === 1}
                  onClick={() =>
                    setPaginaCategorias(
                      Math.max(1, paginaActualCategorias - 1)
                    )
                  }
                >
                  Anterior
                </button>

                <span className="paginacion-indicador">
                  Página {paginaActualCategorias} de {totalPaginasCategorias}
                </span>

                <button
                  type="button"
                  className="paginacion-boton"
                  disabled={paginaActualCategorias === totalPaginasCategorias}
                  onClick={() =>
                    setPaginaCategorias(
                      Math.min(
                        totalPaginasCategorias,
                        paginaActualCategorias + 1
                      )
                    )
                  }
                >
                  Siguiente
                </button>
              </div>
            </nav>
          )}
      </div>

      <dialog
        ref={dialogo}
        className="fintrack-categorias-dialogo"
        aria-labelledby="fintrack-categorias-modal-titulo"
        onCancel={(evento) => {
          if (guardando) evento.preventDefault();
        }}
      >
        <form
          onSubmit={guardar}
          className="fintrack-categorias-formulario"
        >
          <div className="fintrack-categorias-modal-cabecera">
            <h2 id="fintrack-categorias-modal-titulo">
              {categoriaEnEdicion
                ? "Editar categoría"
                : "Nueva categoría"}
            </h2>

            <button
              type="button"
              aria-label="Cerrar modal"
              onClick={cerrar}
              disabled={guardando}
            >
              ×
            </button>
          </div>

          <label htmlFor="fintrack-categorias-nombre">
            Nombre
          </label>

          <input
            id="fintrack-categorias-nombre"
            type="text"
            required
            maxLength={100}
            autoComplete="off"
            placeholder="Ej. Alimentación"
            value={nombre}
            aria-invalid={Boolean(erroresCampos.nombre)}
            aria-describedby={
              erroresCampos.nombre
                ? "fintrack-categorias-nombre-error"
                : undefined
            }
            onChange={(evento) => {
              setNombre(evento.target.value)
              setErroresCampos((actuales) => ({
                ...actuales,
                nombre: "",
              }));
            }}
            disabled={guardando}
          />
          {erroresCampos.nombre && (
            <p
              id="fintrack-categorias-nombre-error"
              className="fintrack-categorias-error-campo"
              role="alert"
            >
              {erroresCampos.nombre}
            </p>
          )}

          <fieldset disabled={guardando}>
            <legend>Tipo</legend>

            <label>
              <input
                type="radio"
                name="fintrack-categoria-tipo"
                value="gasto"
                checked={tipo === "gasto"}
                aria-invalid={Boolean(erroresCampos.tipo)}
                aria-describedby={
                  erroresCampos.tipo
                    ? "fintrack-categorias-tipo-error"
                    : undefined
                }
                onChange={() => {
                  setTipo("gasto");
                  setErroresCampos((actuales) => ({
                    ...actuales,
                    tipo: "",
                  }));
                }}
              />
              Gasto
            </label>

            <label>
              <input
                type="radio"
                name="fintrack-categoria-tipo"
                value="ingreso"
                checked={tipo === "ingreso"}
                aria-invalid={Boolean(erroresCampos.tipo)}
                aria-describedby={
                  erroresCampos.tipo
                    ? "fintrack-categorias-tipo-error"
                    : undefined
                }
                onChange={() => {
                  setTipo("ingreso");
                  setErroresCampos((actuales) => ({
                    ...actuales,
                    tipo: "",
                  }));
                }}
              />
              Ingreso
            </label>
          </fieldset>

          {categoriaEnEdicion && (
            <p className="fintrack-categorias-ayuda">
              Si ya tiene transacciones, puedes cambiar el nombre, pero no el
              tipo.
            </p>
          )}
          {erroresCampos.tipo && (
            <p
              id="fintrack-categorias-tipo-error"
              className="fintrack-categorias-error-campo"
              role="alert"
            >
              {erroresCampos.tipo}
            </p>
          )}

          {errorFormulario && (
            <p
              className="fintrack-categorias-error"
              role="alert"
            >
              {errorFormulario}
            </p>
          )}

          <div className="fintrack-categorias-acciones">
            <button
              type="button"
              className="fintrack-categorias-secundario"
              disabled={guardando}
              onClick={cerrar}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="fintrack-categorias-primario"
              disabled={guardando}
            >
              {guardando
                ? categoriaEnEdicion
                  ? "Guardando cambios..."
                  : "Creando categoría..."
                : categoriaEnEdicion
                  ? "Guardar cambios"
                  : "Crear categoría"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={dialogoReactivacion}
        className="fintrack-categorias-dialogo"
        aria-labelledby="fintrack-categorias-reactivar-titulo"
        onCancel={(evento) => {
          if (reactivando) evento.preventDefault();
        }}
        onClose={() => {
          setCategoriaPorReactivar(null);
          setErrorReactivacion("");
          botonReactivacion.current?.focus();
        }}
      >
        <form
          onSubmit={reactivarCategoria}
          className="fintrack-categorias-formulario"
        >
          <div className="fintrack-categorias-modal-cabecera">
            <h2 id="fintrack-categorias-reactivar-titulo">
              Activar categoría
            </h2>
            <button
              type="button"
              aria-label="Cerrar confirmación"
              onClick={() => dialogoReactivacion.current?.close()}
              disabled={reactivando}
            >
              ×
            </button>
          </div>

          <p>
            ¿Deseas activar la categoría{" "}
            <strong>{categoriaPorReactivar?.nombre}</strong>? Volverá a estar
            disponible para registrar nuevos ingresos o gastos.
          </p>

          {errorReactivacion && (
            <p className="fintrack-categorias-error" role="alert">
              {errorReactivacion}
            </p>
          )}

          <div className="fintrack-categorias-acciones">
            <button
              type="button"
              className="fintrack-categorias-secundario"
              disabled={reactivando}
              onClick={() => dialogoReactivacion.current?.close()}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="fintrack-categorias-primario"
              disabled={reactivando}
            >
              {reactivando ? "Activando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={dialogoDesactivacion}
        className="fintrack-categorias-dialogo"
        aria-labelledby="fintrack-categorias-desactivar-titulo"
        onCancel={(evento) => {
          if (desactivando) evento.preventDefault();
        }}
        onClose={() => {
          setCategoriaPorDesactivar(null);
          setErrorDesactivacion("");
          botonDesactivacion.current?.focus();
        }}
      >
        <form
          onSubmit={desactivarCategoriaSeleccionada}
          className="fintrack-categorias-formulario"
        >
          <div className="fintrack-categorias-modal-cabecera">
            <h2 id="fintrack-categorias-desactivar-titulo">
              Desactivar categoría
            </h2>
            <button
              type="button"
              aria-label="Cerrar confirmación"
              onClick={() => dialogoDesactivacion.current?.close()}
              disabled={desactivando}
            >
              ×
            </button>
          </div>

          <p>
            ¿Deseas desactivar la categoría{" "}
            <strong>{categoriaPorDesactivar?.nombre}</strong>? Dejará de estar
            disponible para nuevas transacciones, pero sus ingresos y gastos
            históricos se conservarán.
          </p>

          {errorDesactivacion && (
            <p className="fintrack-categorias-error" role="alert">
              {errorDesactivacion}
            </p>
          )}

          <div className="fintrack-categorias-acciones">
            <button
              type="button"
              className="fintrack-categorias-secundario"
              disabled={desactivando}
              onClick={() => dialogoDesactivacion.current?.close()}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="fintrack-categorias-primario"
              disabled={desactivando}
            >
              {desactivando ? "Desactivando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}