import { useEffect, useRef, useState } from "react";
import { crearCategoria, obtenerCategorias } from "../services/categoriaService.js";
import "./CategoriasPanel.css";

const filtros = [
  { id: "todas", texto: "Todas" },
  { id: "gasto", texto: "Gastos" },
  { id: "ingreso", texto: "Ingresos" },
];

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
  const dialogo = useRef(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setErrorCarga("");

    obtenerCategorias(token)
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
    setNombre("");
    setTipo("gasto");
    setErrorFormulario("");
    setMensaje("");
    dialogo.current?.showModal();
  }

  function cerrar() {
    if (guardando) return;
    dialogo.current?.close();
    setErrorFormulario("");
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (guardando) return;

    const limpio = nombre.trim();

    if (
      !limpio ||
      limpio.length > 100 ||
      /[\x00-\x1F\x7F]/.test(limpio)
    ) {
      setErrorFormulario(
        "Introduce un nombre válido de 1 a 100 caracteres."
      );
      return;
    }

    setGuardando(true);
    setErrorFormulario("");

    try {
      await crearCategoria(
        { nombre: limpio, tipo },
        token
      );

      dialogo.current?.close();
      setMensaje("Categoría creada correctamente.");
      setPaginaCategorias(1);
      setRecarga((valor) => valor + 1);
    } catch (error) {
      setErrorFormulario(
        error.message || "No se pudo crear la categoría."
      );
    } finally {
      setGuardando(false);
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
                    `fintrack-categorias-tipo ` +
                    `fintrack-categorias-tipo-${categoria.tipo}`
                  }
                >
                  {categoria.tipo === "ingreso"
                    ? "Ingreso"
                    : "Gasto"}
                </span>
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
              Nueva categoría
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
            onChange={(evento) =>
              setNombre(evento.target.value)
            }
            disabled={guardando}
          />

          <fieldset disabled={guardando}>
            <legend>Tipo</legend>

            <label>
              <input
                type="radio"
                name="fintrack-categoria-tipo"
                value="gasto"
                checked={tipo === "gasto"}
                onChange={() => setTipo("gasto")}
              />
              Gasto
            </label>

            <label>
              <input
                type="radio"
                name="fintrack-categoria-tipo"
                value="ingreso"
                checked={tipo === "ingreso"}
                onChange={() => setTipo("ingreso")}
              />
              Ingreso
            </label>
          </fieldset>

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
                ? "Creando categoría..."
                : "Crear categoría"}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}