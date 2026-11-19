import { useEffect, useState } from "react";
import { obtenerTransacciones } from "../services/financeService.js";

function formatearFecha(fecha) {
  const fechaLocal = new Date(`${String(fecha).slice(0, 10)}T00:00:00`);

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(fechaLocal);
}

function formatearMonto(monto) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
  }).format(Number(monto));
}

function organizarTransacciones(transacciones) {
  return [...transacciones].sort((primera, segunda) => {
    const fechaPrimera = String(primera.fecha).slice(0, 10);
    const fechaSegunda = String(segunda.fecha).slice(0, 10);

    if (fechaPrimera !== fechaSegunda) {
      return fechaSegunda.localeCompare(fechaPrimera);
    }

    const creacionPrimera = String(primera.created_at ?? "");
    const creacionSegunda = String(segunda.created_at ?? "");

    if (creacionPrimera !== creacionSegunda) {
      return creacionSegunda.localeCompare(creacionPrimera);
    }

    return Number(segunda.id ?? 0) - Number(primera.id ?? 0);
  });
}

function FinancePanel({ usuario, token, onLogout }) {
  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarTransacciones() {
      try {
        const resultado = await obtenerTransacciones(token);

        if (activo) {
          setTransacciones(organizarTransacciones(resultado));
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

    cargarTransacciones();

    return () => {
      activo = false;
    };
  }, [token]);

  return (
    <main className="role-panel">
      <section className="role-card finance-card">
        <p className="role-label">Panel financiero</p>
        <h1>Bienvenido, {usuario.nombre}</h1>
        <p>Desde aquí puedes gestionar tus ingresos, gastos y resumen financiero.</p>

        <section className="historial-seccion" aria-label="Historial de transacciones">
          <h2>Historial de transacciones</h2>

          {cargando && <p role="status">Cargando transacciones...</p>}

          {!cargando && error && (
            <p className="historial-error" role="alert">{error}</p>
          )}

          {!cargando && !error && transacciones.length === 0 && (
            <p role="status">No tienes transacciones registradas.</p>
          )}

          {!cargando && !error && transacciones.length > 0 && (
            <div className="historial-tabla-contenedor">
              <table className="historial-tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {transacciones.map((transaccion) => (
                    <tr key={transaccion.id}>
                      <td>{formatearFecha(transaccion.fecha)}</td>
                      <td>{transaccion.descripcion || "Sin descripción"}</td>
                      <td>{transaccion.categoria}</td>
                      <td>
                        <span className={`tipo-transaccion tipo-${transaccion.tipo}`}>
                          {transaccion.tipo === "ingreso" ? "Ingreso" : "Gasto"}
                        </span>
                      </td>
                      <td className={`monto-transaccion monto-${transaccion.tipo}`}>
                        {transaccion.tipo === "ingreso" ? "+" : "-"}
                        {formatearMonto(transaccion.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <button type="button" onClick={onLogout}>Cerrar sesión</button>
      </section>
    </main>
  );
}

export default FinancePanel;
