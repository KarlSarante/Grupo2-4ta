
import { useState } from "react";
import Login from "./pages/Login.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import FinancePanel from "./pages/FinancePanel.jsx";
import { cerrarSesion } from "./services/authService.js";
import "./App.css";

function App() {
  const [sesion, setSesion] = useState(() => {
    const sesionGuardada = localStorage.getItem("sesion");
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  });

  const handleLogout = () => {
    cerrarSesion();
    setSesion(null);
  };

  if (!sesion) {
    return <Login onLogin={setSesion} />;
  }

  return sesion.usuario.rol === "administrador" ? (
    <AdminPanel usuario={sesion.usuario} onLogout={handleLogout} />
  ) : (
    <FinancePanel usuario={sesion.usuario} onLogout={handleLogout} />
  );
}

export default App;
