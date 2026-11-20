import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { obtenerCategorias } from "../services/categoriaService.js";
import { registrarGasto } from "../services/gastoService.js";

// HU005 / #75: Comprueba que la fecha exista en el calendario.
function esFechaValida(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }

    const [anio, mes, dia] = fecha.split("-").map(Number);

    if (anio < 1000 || anio > 9999) {
        return false;
    }

    const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));

    return (
        fechaUTC.getUTCFullYear() === anio &&
        fechaUTC.getUTCMonth() === mes - 1 &&
        fechaUTC.getUTCDate() === dia
    );
}

// HU005 / #75: Esquema Zod del formulario de gastos.
const gastoFormSchema = z.object({
    monto: z.string()
        .trim()
        .min(1, "El monto es obligatorio")
        .refine(
            (valor) => valor === "" || Number.isFinite(Number(valor)),
            "El monto debe ser un número válido"
        )
        .refine(
            (valor) => valor === "" || Number(valor) > 0,
            "El monto debe ser mayor que cero"
        )
        .refine(
            (valor) => valor === "" || Number(valor) <= 9999999999.99,
            "El monto supera el máximo permitido"
        )
        .refine(
            (valor) =>
                valor === "" ||
                !Number.isFinite(Number(valor)) ||
                Math.abs(Number(valor) * 100 - Math.round(Number(valor) * 100)) < 1e-6,
            "El monto no puede tener más de dos decimales"
        ),

    categoria: z.string()
        .min(1, "Selecciona una categoría")
        .refine(
            (valor) =>
                valor === "" ||
                (Number.isSafeInteger(Number(valor)) && Number(valor) > 0),
            "Selecciona una categoría válida"
        ),

    fecha: z.string()
        .min(1, "La fecha es obligatoria")
        .refine(
            (valor) => valor === "" || esFechaValida(valor),
            "La fecha debe ser válida y tener formato YYYY-MM-DD"
        ),

    descripcion: z.string()
        .max(255, "La descripción no puede superar los 255 caracteres"),
});

// HU005 / #75: Formulario de registro de gastos.
// Mantiene la estructura visual de los formularios del AdminPanel / IngresoForm.
function GastoForm({ onVolver, onGastoRegistrado, onSesionExpirada }) {
    const [monto, setMonto] = useState("");
    const [categoria, setCategoria] = useState("");
    const [fecha, setFecha] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [errores, setErrores] = useState({});
    const [categoriasGasto, setCategoriasGasto] = useState([]);
    const [cargandoCategorias, setCargandoCategorias] = useState(true);
    const [errorCategorias, setErrorCategorias] = useState("");
    const [guardandoGasto, setGuardandoGasto] = useState(false);
    const [errorRegistro, setErrorRegistro] = useState("");
    const [confirmacion, setConfirmacion] = useState("");

    // Referencia al campo para abrir el calendario.
    const referenciaFecha = useRef(null);

    // HU005 / #75: Bloqueo inmediato contra solicitudes duplicadas.
    const envioEnCurso = useRef(false);

    // Ocultar mensaje de confirmación automáticamente tras 5 segundos.
    useEffect(() => {
        if (!confirmacion) {
            return;
        }

        const temporizador = setTimeout(() => setConfirmacion(""), 5000);
        return () => clearTimeout(temporizador);
    }, [confirmacion]);

    // HU005 / #75: Cargar las categorías de gasto desde MySQL.
    useEffect(() => {
        let activo = true;

        async function cargarCategorias() {
            setCargandoCategorias(true);
            setErrorCategorias("");

            try {
                const sesion = JSON.parse(
                    localStorage.getItem("sesion") ||
                    sessionStorage.getItem("sesion") ||
                    "null"
                );

                if (!sesion?.token) {
                    throw new Error("La sesión ha expirado. Inicia sesión nuevamente.");
                }

                const resultado = await obtenerCategorias(sesion.token, "gasto");
                const lista = Array.isArray(resultado)
                    ? resultado
                    : (resultado?.categorias ?? []);

                if (activo) {
                    setCategoriasGasto(lista);
                }
            } catch (error) {
                if (error?.estado === 401) {
                    onSesionExpirada?.();
                    return;
                }

                if (activo) {
                    setCategoriasGasto([]);
                    setErrorCategorias(
                        error.message || "No se pudieron cargar las categorías."
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
    }, [onSesionExpirada]);

    // HU005 / #75: Validar y registrar gastos mediante la API.
    async function manejarEnvio(evento) {
        evento.preventDefault();

        // HU005 / #75: Evitar envíos duplicados.
        if (envioEnCurso.current) {
            return;
        }

        // Limpiar mensajes de intentos anteriores.
        setErrorRegistro("");
        setConfirmacion("");

        const resultado = gastoFormSchema.safeParse({
            monto,
            categoria,
            fecha,
            descripcion,
        });

        if (!resultado.success) {
            const nuevosErrores = {};

            for (const error of resultado.error.issues) {
                const campo = error.path[0];

                // Conservar el primer mensaje de cada campo.
                if (campo && !nuevosErrores[campo]) {
                    nuevosErrores[campo] = error.message;
                }
            }

            setErrores(nuevosErrores);

            // Enfocar el primer campo que contiene un error.
            const primerCampo = ["monto", "categoria", "fecha", "descripcion"]
                .find((campo) => nuevosErrores[campo]);

            if (primerCampo) {
                const identificadores = {
                    monto: "gasto-monto",
                    categoria: "gasto-categoria",
                    fecha: "gasto-fecha",
                    descripcion: "gasto-descripcion",
                };

                document.getElementById(identificadores[primerCampo])?.focus();
            }

            return;
        }

        setErrores({});

        envioEnCurso.current = true;
        setGuardandoGasto(true);

        try {
            const sesion = JSON.parse(
                localStorage.getItem("sesion") ||
                sessionStorage.getItem("sesion") ||
                "null"
            );

            if (!sesion?.token) {
                throw new Error(
                    "La sesión ha expirado. Inicia sesión nuevamente."
                );
            }

            const montoFormateado = Number(resultado.data.monto).toLocaleString("es-DO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

            const categoriaSeleccionada = categoriasGasto.find(
                (item) => String(item.id) === String(resultado.data.categoria)
            );

            const gasto = {
                categoria_id: Number(resultado.data.categoria),
                monto: Number(resultado.data.monto),
                fecha: resultado.data.fecha,
                descripcion: resultado.data.descripcion.trim() || null,
            };

            const respuesta = await registrarGasto(gasto, sesion.token);
            const detalleGasto = categoriaSeleccionada
                ? `RD$ ${montoFormateado} en ${categoriaSeleccionada.nombre}`
                : `RD$ ${montoFormateado}`;

            const mensajeExito =
                respuesta?.mensaje
                    ? `${respuesta.mensaje} (${detalleGasto}).`
                    : `Gasto de ${detalleGasto} guardado correctamente.`;

            // Limpiar campos tras registrar con éxito.
            setMonto("");
            setCategoria("");
            setFecha("");
            setDescripcion("");
            setConfirmacion(mensajeExito);

            // Notificar al padre para cerrar/actualizar si está conectado.
            if (typeof onGastoRegistrado === "function") {
                onGastoRegistrado(mensajeExito, respuesta?.alertas ?? []);
            }
        } catch (error) {
            if (error?.estado === 401) {
                onSesionExpirada?.();
                return;
            }

            setErrorRegistro(
                error.message || "No se pudo registrar el gasto."
            );

            // Mostrar los errores de validación devueltos por el backend.
            if (Array.isArray(error.errores)) {
                const erroresServidor = {};

                const equivalencias = {
                    categoria_id: "categoria",
                    monto: "monto",
                    fecha: "fecha",
                    descripcion: "descripcion",
                };

                for (const detalle of error.errores) {
                    const campo = equivalencias[detalle.campo];

                    if (campo && !erroresServidor[campo]) {
                        erroresServidor[campo] = detalle.mensaje;
                    }
                }

                setErrores(erroresServidor);
            }
        } finally {
            envioEnCurso.current = false;
            setGuardandoGasto(false);
        }
    }

    return (
        <section
            className="admin-seccion ingreso-seccion gasto-seccion"
            aria-label="Registro de gastos"
        >

            <h2>Registrar gasto</h2>

            {confirmacion && (
                <div className="gasto-confirmacion" role="status" aria-live="polite">
                    <span className="gasto-confirmacion-icono" aria-hidden="true">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    </span>

                    <div className="gasto-confirmacion-contenido">
                        <strong className="gasto-confirmacion-titulo">
                            ¡Registro exitoso!
                        </strong>
                        <p className="gasto-confirmacion-texto">
                            {confirmacion}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="gasto-confirmacion-cerrar"
                        aria-label="Cerrar mensaje de confirmación"
                        onClick={() => setConfirmacion("")}
                    >
                        ×
                    </button>
                </div>
            )}

            <form
                className="categorias-formulario ingreso-formulario"
                onSubmit={manejarEnvio}
                noValidate
            >
                <fieldset
                    disabled={guardandoGasto}
                    style={{ border: "none", padding: 0, margin: 0, minWidth: 0 }}
                >

                    {/* Monto del gasto en pesos dominicanos. */}
                    <div className="categorias-campo">
                        <label htmlFor="gasto-monto">
                            Monto (RD$)
                        </label>

                        <input
                            id="gasto-monto"
                            name="monto"
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Ej. 1500.00"
                            value={monto}
                            onChange={(evento) => {
                                const nuevoMonto = evento.target.value;
                                setMonto(nuevoMonto);

                                if (errores.monto) {
                                    const resultado = gastoFormSchema.shape.monto.safeParse(nuevoMonto);

                                    setErrores((anteriores) => ({
                                        ...anteriores,
                                        monto: resultado.success
                                            ? ""
                                            : resultado.error.issues[0]?.message || "",
                                    }));
                                }
                            }}

                            aria-invalid={Boolean(errores.monto)}
                            aria-describedby={errores.monto ? "error-gasto-monto" : undefined}

                        />
                        {errores.monto && (
                            <p
                                id="error-gasto-monto"
                                className="categorias-error"
                                role="alert"
                            >
                                {errores.monto}
                            </p>
                        )}
                    </div>

                    {/* Selector de categorías de tipo gasto. */}
                    <div className="categorias-campo">
                        <label htmlFor="gasto-categoria">
                            Categoría
                        </label>

                        <select
                            id="gasto-categoria"
                            name="categoria"
                            value={categoria}
                            onChange={(evento) => {
                                const nuevaCategoria = evento.target.value;
                                setCategoria(nuevaCategoria);

                                if (errores.categoria) {
                                    const resultado = gastoFormSchema.shape.categoria.safeParse(nuevaCategoria);

                                    setErrores((anteriores) => ({
                                        ...anteriores,
                                        categoria: resultado.success
                                            ? ""
                                            : resultado.error.issues[0]?.message || "",
                                    }));
                                }
                            }}

                            aria-invalid={Boolean(errores.categoria)}
                            aria-describedby={errores.categoria ? "error-gasto-categoria" : undefined}
                            disabled={cargandoCategorias || Boolean(errorCategorias)}
                        >

                            <option value="">
                                {cargandoCategorias
                                    ? "Cargando categorías..."
                                    : "Selecciona una categoría"}
                            </option>

                            {categoriasGasto.map((categoriaGasto) => (
                                <option
                                    key={categoriaGasto.id}
                                    value={categoriaGasto.id}
                                >
                                    {categoriaGasto.nombre}
                                </option>
                            ))}
                        </select>

                        {/* HU005 / #75: Mostrar errores al consultar categorías. */}
                        {errorCategorias && (
                            <p className="categorias-error" role="alert">
                                {errorCategorias}
                            </p>
                        )}

                        {errores.categoria && (
                            <p
                                id="error-gasto-categoria"
                                className="categorias-error"
                                role="alert"
                            >
                                {errores.categoria}
                            </p>
                        )}

                    </div>

                    {/* Fecha correspondiente al gasto. */}
                    <div className="categorias-campo">
                        <label htmlFor="gasto-fecha">
                            Fecha
                        </label>

                        <div className="ingreso-fecha-contenedor">
                            <input
                                ref={referenciaFecha}
                                id="gasto-fecha"
                                name="fecha"
                                type="date"
                                value={fecha}
                                onChange={(evento) => {
                                    const nuevaFecha = evento.target.value;
                                    setFecha(nuevaFecha);

                                    if (errores.fecha) {
                                        const resultado = gastoFormSchema.shape.fecha.safeParse(nuevaFecha);

                                        setErrores((anteriores) => ({
                                            ...anteriores,
                                            fecha: resultado.success
                                                ? ""
                                                : resultado.error.issues[0]?.message || "",
                                        }));
                                    }
                                }}

                                aria-invalid={Boolean(errores.fecha)}
                                aria-describedby={errores.fecha ? "error-gasto-fecha" : undefined}

                            />

                            <button
                                type="button"
                                className="ingreso-fecha-boton"
                                aria-label="Seleccionar fecha"
                                onClick={() => {
                                    const campo = referenciaFecha.current;

                                    if (typeof campo?.showPicker === "function") {
                                        campo.showPicker();
                                    } else {
                                        campo?.focus();
                                        campo?.click();
                                    }
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <rect x="3" y="5" width="18" height="16" rx="2" />
                                    <path d="M16 3v4M8 3v4M3 10h18" />
                                </svg>
                            </button>
                        </div>

                        {errores.fecha && (
                            <p
                                id="error-gasto-fecha"
                                className="categorias-error"
                                role="alert"
                            >
                                {errores.fecha}
                            </p>
                        )}

                    </div>

                    {/* Información adicional opcional. */}
                    <div className="categorias-campo">
                        <label htmlFor="gasto-descripcion">
                            Descripción (opcional)
                        </label>

                        <textarea
                            id="gasto-descripcion"
                            name="descripcion"
                            placeholder="Ej. Compra del supermercado"
                            value={descripcion}
                            onChange={(evento) => {
                                const nuevaDescripcion = evento.target.value;
                                setDescripcion(nuevaDescripcion);

                                if (errores.descripcion) {
                                    const resultado = gastoFormSchema.shape.descripcion.safeParse(nuevaDescripcion);

                                    setErrores((anteriores) => ({
                                        ...anteriores,
                                        descripcion: resultado.success
                                            ? ""
                                            : resultado.error.issues[0]?.message || "",
                                    }));
                                }
                            }}
                            maxLength={255}
                            rows={3}

                            aria-invalid={Boolean(errores.descripcion)}
                            aria-describedby={errores.descripcion ? "error-gasto-descripcion" : undefined}
                        />

                        {errores.descripcion && (
                            <p
                                id="error-gasto-descripcion"
                                className="categorias-error"
                                role="alert"
                            >
                                {errores.descripcion}
                            </p>
                        )}

                    </div>

                    {/* HU005 / #75: Acciones del formulario. */}
                    <div className="ingreso-acciones">
                        <button
                            type="button"
                            className="ingreso-cancelar"
                            onClick={onVolver}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="ingreso-guardar"
                            disabled={guardandoGasto || cargandoCategorias || Boolean(errorCategorias)}
                            aria-busy={guardandoGasto}
                        >
                            {guardandoGasto ? "Guardando gasto..." : "Guardar gasto"}
                        </button>
                    </div>

                    {/* HU005 / #75: Resultado del registro mediante la API. */}
                    {errorRegistro && (
                        <p className="categorias-error" role="alert">
                            {errorRegistro}
                        </p>
                    )}

                </fieldset>
            </form>
        </section>
    );
}

export default GastoForm;