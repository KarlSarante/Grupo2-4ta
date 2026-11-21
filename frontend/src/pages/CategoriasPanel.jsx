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
      setRecarga((valor) => valor + 1);
    } catch (error) {
      setErrorFormulario(
        error.message || "No se pudo crear la categoría."
      );
    } finally {
      setGuardando(false);
    }
  }

  const visibles = categorias.filter(
    (categoria) =>
      filtro === "todas" || categoria.tipo === filtro
  );

  return (
    <section
      className="fintrack-categorias"
      aria-label="Categorías"
    >
      <div className="fintrack-categorias-cabecera">
        <div>
          <h2>Mis categorías</h2>
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

      <div className="fintrack-categorias-tarjeta">
        <div
          className="fintrack-categorias-filtros"
          role="group"
          aria-label="Filtrar categorías"
        >
          {filtros.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              aria-pressed={filtro === opcion.id}
              className={
                filtro === opcion.id ? "activo" : ""
              }
              onClick={() => setFiltro(opcion.id)}
            >
              {opcion.texto}
            </button>
          ))}
        </div>

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
            {visibles.map((categoria) => (
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