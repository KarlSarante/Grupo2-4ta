import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { obtenerCategorias } from "../services/categoriaService.js";
import { registrarIngreso } from "../services/ingresoService.js";

// HU004 / #65: Comprueba que la fecha exista en el calendario.
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

// HU004 / #65: Esquema Zod del formulario de ingresos.
const ingresoFormSchema = z.object({
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

// HU004 / #64: Formulario de registro de ingresos.
// Mantiene la estructura visual de los formularios del AdminPanel.
function IngresoForm({ onVolver, onIngresoRegistrado }) {
    const [monto, setMonto] = useState("");
    const [categoria, setCategoria] = useState("");
    const [fecha, setFecha] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [errores, setErrores] = useState({});
    const [categoriasIngreso, setCategoriasIngreso] = useState([]);
    const [cargandoCategorias, setCargandoCategorias] = useState(true);
    const [errorCategorias, setErrorCategorias] = useState("");
    const [guardandoIngreso, setGuardandoIngreso] = useState(false);
    const [errorRegistro, setErrorRegistro] = useState("");

    // Referencia al campo para abrir el calendario.
    const referenciaFecha = useRef(null);

    // HU004 / #66: Bloqueo inmediato contra solicitudes duplicadas.
    const envioEnCurso = useRef(false);


    // HU004 / #66: Cargar las categorías de ingreso desde MySQL.
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

                const categorias = await obtenerCategorias(sesion.token, "ingreso");

                if (activo) {
                    setCategoriasIngreso(categorias);
                }
            } catch (error) {
                if (activo) {
                    setCategoriasIngreso([]);
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
    }, []);

    // HU004 / #66: Validar y registrar ingresos mediante la API.

    async function manejarEnvio(evento) {
        evento.preventDefault();

        // HU004 / #66: Evitar envíos duplicados.
        if (envioEnCurso.current) {
            return;
        }

        // Limpiar los mensajes de intentos anteriores.
        setErrorRegistro("");

        const resultado = ingresoFormSchema.safeParse({
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
                    monto: "ingreso-monto",
                    categoria: "ingreso-categoria",
                    fecha: "ingreso-fecha",
                    descripcion: "ingreso-descripcion",
                };

                document.getElementById(identificadores[primerCampo])?.focus();
            }

            return;
        }

        setErrores({});


        envioEnCurso.current = true;
        setGuardandoIngreso(true);

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

            const ingreso = {
                categoria_id: Number(resultado.data.categoria),
                monto: Number(resultado.data.monto),
                fecha: resultado.data.fecha,
                descripcion: resultado.data.descripcion,
            };

            const respuesta = await registrarIngreso(ingreso, sesion.token);

            // Notificar al panel financiero después del registro exitoso.
            onIngresoRegistrado(
                respuesta.mensaje || "Ingreso registrado correctamente."
            );
        } catch (error) {
            setErrorRegistro(
                error.message || "No se pudo registrar el ingreso."
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
            setGuardandoIngreso(false);
        }

    }

    return (
        <section
            className="admin-seccion ingreso-seccion"
            aria-label="Registro de ingresos"
        >

            <h2>Registrar ingreso</h2>
            <form
                className="categorias-formulario ingreso-formulario"
                onSubmit={manejarEnvio}
                noValidate
            >
                <fieldset
                    disabled={guardandoIngreso}
                    style={{ border: "none", padding: 0, margin: 0, minWidth: 0 }}
                >

                    {/* Monto del ingreso en pesos dominicanos. */}
                    <div className="categorias-campo">
                        <label htmlFor="ingreso-monto">
                            Monto (RD$)
                        </label>

                        <input
                            id="ingreso-monto"
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
                                    const resultado = ingresoFormSchema.shape.monto.safeParse(nuevoMonto);

                                    setErrores((anteriores) => ({
                                        ...anteriores,
                                        monto: resultado.success
                                            ? ""
                                            : resultado.error.issues[0]?.message || "",
                                    }));
                                }
                            }}

                            aria-invalid={Boolean(errores.monto)}
                            aria-describedby={errores.monto ? "error-ingreso-monto" : undefined}

                        />
                        {errores.monto && (
                            <p
                                id="error-ingreso-monto"
                                className="categorias-error"
                                role="alert"
                            >
                                {errores.monto}
                            </p>
                        )}
                    </div>

                    {/* Selector de categorías de tipo ingreso. */}
                    <div className="categorias-campo">
                        <label htmlFor="ingreso-categoria">
                            Categoría
                        </label>

                        <select
                            id="ingreso-categoria"
                            name="categoria"
                            value={categoria}
                            onChange={(evento) => {
                                const nuevaCategoria = evento.target.value;
                                setCategoria(nuevaCategoria);

                                if (errores.categoria) {
                                    const resultado = ingresoFormSchema.shape.categoria.safeParse(nuevaCategoria);

                                    setErrores((anteriores) => ({
                                        ...anteriores,
                                        categoria: resultado.success
                                            ? ""
                                            : resultado.error.issues[0]?.message || "",
                                    }));
                                }
                            }}

                            aria-invalid={Boolean(errores.categoria)}
                            aria-describedby={errores.categoria ? "error-ingreso-categoria" : undefined}
                            disabled={cargandoCategorias || Boolean(errorCategorias)}
                        >

                            <option value="">
                                {cargandoCategorias
                                    ? "Cargando categorías..."
                                    : "Selecciona una categoría"}
                            </option>

                            {categoriasIngreso.map((categoriaIngreso) => (
                                <option
                                    key={categoriaIngreso.id}
                                    value={categoriaIngreso.id}
                                >
                                    {categoriaIngreso.nombre}
                                </option>
                            ))}
                        </select>

                        {/* HU004 / #66: Mostrar errores al consultar categorías. */}
                        {errorCategorias && (
                            <p className="categorias-error" role="alert">
                                {errorCategorias}
                            </p>
                        )}

                        {errores.categoria && (
                            <p
                                id="error-ingreso-categoria"
                                className="categorias-error"
                                role="alert"
                            >
                                {errores.categoria}
                            </p>
                        )}

                    </div>

                    {/* Fecha correspondiente al ingreso. */}
                    <div className="categorias-campo">
                        <label htmlFor="ingreso-fecha">
                            Fecha
                        </label>



                        <div className="ingreso-fecha-contenedor">
                            <input
                                ref={referenciaFecha}
                                id="ingreso-fecha"
                                name="fecha"
                                type="date"
                                value={fecha}
                                onChange={(evento) => {
                                    const nuevaFecha = evento.target.value;
                                    setFecha(nuevaFecha);

                                    if (errores.fecha) {
                                        const resultado = ingresoFormSchema.shape.fecha.safeParse(nuevaFecha);

                                        setErrores((anteriores) => ({
                                            ...anteriores,
                                            fecha: resultado.success
                                                ? ""
                                                : resultado.error.issues[0]?.message || "",
                                        }));
                                    }
                                }}

                                aria-invalid={Boolean(errores.fecha)}
                                aria-describedby={errores.fecha ? "error-ingreso-fecha" : undefined}

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
                                id="error-ingreso-fecha"
                                className="categorias-error"
                                role="alert"
                            >
                                {errores.fecha}
                            </p>
                        )}


                    </div>

                    {/* Información adicional opcional. */}
                    <div className="categorias-campo">
                        <label htmlFor="ingreso-descripcion">
                            Descripción (opcional)
                        </label>

                        <textarea
                            id="ingreso-descripcion"
                            name="descripcion"
                            placeholder="Ej. Pago de nómina"
                            value={descripcion}
                            onChange={(evento) => {
                                const nuevaDescripcion = evento.target.value;
                                setDescripcion(nuevaDescripcion);

                                if (errores.descripcion) {
                                    const resultado = ingresoFormSchema.shape.descripcion.safeParse(nuevaDescripcion);

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
                            aria-describedby={errores.descripcion ? "error-ingreso-descripcion" : undefined}
                        />

                        {errores.descripcion && (
                            <p
                                id="error-ingreso-descripcion"
                                className="categorias-error"
                                role="alert"
                            >
                                {errores.descripcion}
                            </p>
                        )}

                    </div>

                    {/* HU004 / #65: Validar el formulario sin registrar datos todavía. */}
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
                            disabled={guardandoIngreso || cargandoCategorias || Boolean(errorCategorias)}
                            aria-busy={guardandoIngreso}
                        >
                            {guardandoIngreso ? "Guardando ingreso..." : "Guardar ingreso"}
                        </button>
                    </div>


                    {/* HU004 / #66: Resultado del registro mediante la API. */}
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

export default IngresoForm;
