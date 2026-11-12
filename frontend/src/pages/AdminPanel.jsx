import { useEffect, useState } from "react";
import { obtenerUsuarios } from "../services/adminService.js";

function AdminPanel({ usuario, token, onLogout }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main className="role-panel">
      <section className="role-card">
        <p className="role-label">Panel administrativo</p>

        <h1>Bienvenido, {usuario.nombre}</h1>

        <p>Consulta las cuentas registradas en la plataforma.</p>

        <h2>Usuarios registrados</h2>

        {cargando && <p>Cargando usuarios...</p>}

        {!cargando && error && (
          <p role="alert">{error}</p>
        )}

        {!cargando && !error && usuarios.length === 0 && (
          <p>No hay usuarios registrados.</p>
        )}

        {!cargando && !error && usuarios.length > 0 && (
          <div className="usuarios-tabla-contenedor">
            <table className="usuarios-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo electrónico</th>
                  <th>Rol</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.map((cuenta) => (
                  <tr key={cuenta.id}>
                    <td>{cuenta.nombre}</td>
                    <td>{cuenta.email}</td>
                    <td>{cuenta.rol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button type="button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}

export default AdminPanel;
