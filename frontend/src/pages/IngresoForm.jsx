import { useRef, useState } from "react";

// HU004 / #64: Formulario de registro de ingresos.
// Mantiene la estructura visual de los formularios del AdminPanel.
function IngresoForm({ onVolver }) {
    const [monto, setMonto] = useState("");
    const [categoria, setCategoria] = useState("");
    const [fecha, setFecha] = useState("");
    const [descripcion, setDescripcion] = useState("");

    // Referencia al campo para abrir el calendario.
    const referenciaFecha = useRef(null);

    // HU004 / #66: La conexión con la API se realizará posteriormente.
    function manejarEnvio(evento) {
        evento.preventDefault();
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
                        onChange={(evento) => setMonto(evento.target.value)}
                        required
                    />
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
                        onChange={(evento) => setCategoria(evento.target.value)}
                        required
                    >
                        <option value="">
                            Selecciona una categoría
                        </option>

                        {/* HU004 / #66: Cargar categorías desde la API. */}
                    </select>
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
                            onChange={(evento) => setFecha(evento.target.value)}
                            required
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
                        onChange={(evento) => setDescripcion(evento.target.value)}
                        maxLength={255}
                        rows={3}
                    />
                </div>

                {/* El envío se habilitará al conectar el backend en #66. */}
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
                        disabled
                    >
                        Guardar ingreso
                    </button>
                </div>

                <p className="categorias-aviso">
                    El registro estará disponible cuando se complete
                    la conexión con la API.
                </p>
            </form>
        </section>
    );
}

export default IngresoForm;
