
import { useState } from "react";
import Login from "./pages/login.jsx";
import Inicio from "./pages/Inicio.jsx";
import Registro from "./pages/Registro.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import FinancePanel from "./pages/FinancePanel.jsx";
import { cerrarSesion } from "./services/authService.js";
import "./App.css";

function App() {
  const [pantalla, setPantalla] = useState("inicio");

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
    if (pantalla === "registro") {
      return (
        <Registro onVolverLogin={() => setPantalla("login")} />
      );
    }

    if (pantalla === "inicio") {
      return <Inicio onLogin={() => setPantalla("login")} />;
    }

    return (
      <div>
        <Login
          onLogin={setSesion}
          onRegister={() => setPantalla("registro")}
        />
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