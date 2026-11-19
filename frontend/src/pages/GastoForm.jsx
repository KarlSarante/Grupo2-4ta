import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { registrarGasto } from "../services/gastoService.js";

// HU005: Comprueba que la fecha exista en el calendario.
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

// HU005: Esquema Zod del formulario de gastos.
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


// HU005: Formulario de registro de gastos.
// Usa las mismas clases CSS que IngresoForm para mantener el diseño unificado.
// onSesionExpirada: se ejecuta si el servidor responde 401 (token inválido, vencido o revocado).
function GastoForm({ onVolver, onSesionExpirada }) {
    const [monto, setMonto] = useState("");
    const [categoria, setCategoria] = useState("");
    const [fecha, setFecha] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [errores, setErrores] = useState({});
    const [enviando, setEnviando] = useState(false);
    const [errorGeneral, setErrorGeneral] = useState("");
    const [confirmacion, setConfirmacion] = useState("");

    // Referencia al campo para abrir el calendario.
    const referenciaFecha = useRef(null);

    // La confirmación de registro desaparece sola a los 6 segundos.
    useEffect(() => {
        if (!confirmacion) {
            return;
        }

        const temporizador = setTimeout(() => setConfirmacion(""), 6000);

        return () => clearTimeout(temporizador);
    }, [confirmacion]);

    async function manejarEnvio(evento) {
        evento.preventDefault();

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
        setErrorGeneral("");
        setConfirmacion("");
        setEnviando(true);

        try {
            // POST /api/finanzas/gastos con el token JWT de la sesión.
            const respuesta = await registrarGasto({
                categoria_id: Number(categoria),
                monto: Number(monto),
                fecha,
                descripcion: descripcion.trim() || null,
            });

            // Limpiar el formulario y confirmar el registro.
            setMonto("");
            setCategoria("");
            setFecha("");
            setDescripcion("");
            setConfirmacion(
                respuesta?.mensaje || "Gasto registrado correctamente"
            );
        } catch (error) {
            if (error.estado === 401) {
                // Token inválido, vencido o revocado: volver al inicio de sesión.
                onSesionExpirada?.();
                return;
            }

            // Errores por campo enviados por el servidor.
            const erroresServidor = {};

            for (const item of error.errores ?? []) {
                const campo = item.campo === "categoria_id" ? "categoria" : item.campo;

                if (
                    ["monto", "categoria", "fecha", "descripcion"].includes(campo) &&
                    !erroresServidor[campo]
                ) {
                    erroresServidor[campo] = item.mensaje;
                }
            }

            if (Object.keys(erroresServidor).length > 0) {
                setErrores(erroresServidor);
            } else {
                setErrorGeneral(error.message || "No se pudo registrar el gasto");
            }
        } finally {
            setEnviando(false);
        }
    }


    return (
        <section
            className="admin-seccion ingreso-seccion gasto-seccion"
            aria-label="Registro de gastos"
        >

            <h2>Registrar gasto</h2>

            {/* Confirmación del registro exitoso. */}
            {confirmacion && (
                <p className="gasto-confirmacion" role="status">
                    {confirmacion}
                </p>
            )}

            <form
                className="categorias-formulario ingreso-formulario"
                onSubmit={manejarEnvio}
                noValidate
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
                    >
                        <option value="">
                            Selecciona una categoría
                        </option>

                        {/* HU005: Cargar categorías de gasto desde la API. */}
                    </select>

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

                {/* Error general del servidor o de conexión. */}
                {errorGeneral && (
                    <p className="categorias-error" role="alert">
                        {errorGeneral}
                    </p>
                )}

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
                        disabled={enviando}
                    >
                        {enviando ? "Guardando..." : "Guardar gasto"}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default GastoForm;