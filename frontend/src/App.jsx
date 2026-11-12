
import { useState } from "react";
import Login from "./pages/login.jsx";
import Registro from "./pages/Registro.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import FinancePanel from "./pages/FinancePanel.jsx";
import { cerrarSesion } from "./services/authService.js";
import "./App.css";

function App() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const [sesion, setSesion] = useState(() => {
    try {
      const sesionGuardada = localStorage.getItem("sesion");
      return sesionGuardada ? JSON.parse(sesionGuardada) : null;
    } catch {
      localStorage.removeItem("sesion");
      return null;
    }
  });

  const handleLogout = () => {
    cerrarSesion();
    setSesion(null);
  };

  if (!sesion?.usuario || !sesion?.token) {
    if (mostrarRegistro) {
      return (
        <Registro onVolverLogin={() => setMostrarRegistro(false)} />
      );
    }

    return (
      <div>
        <Login onLogin={setSesion} />
        <div style={{ textAlign: "center", padding: "0 20px 24px" }}>
          <button
            type="button"
            onClick={() => setMostrarRegistro(true)}
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </div>
      </div>
    );
  }

  return sesion.usuario.rol === "administrador" ? (
    <AdminPanel usuario={sesion.usuario} onLogout={handleLogout} />
  ) : (
    <FinancePanel usuario={sesion.usuario} onLogout={handleLogout} />
  );
}

export default App;