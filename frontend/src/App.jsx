import { useEffect, useState } from "react";
import Login from "./pages/login.jsx";
import Inicio from "./pages/Inicio.jsx";
import Registro from "./pages/Registro.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import FinancePanel from "./pages/FinancePanel.jsx";
import { cerrarSesion } from "./services/authService.js";
import "./App.css";

function App() {

  const [pantalla, setPantalla] = useState(() => {
    try {
      const pantallaGuardada = sessionStorage.getItem("pantallaActual");

      return ["inicio", "login", "registro"].includes(pantallaGuardada)
        ? pantallaGuardada
        : "inicio";
    } catch {
      return "inicio";
    }
  });


  useEffect(() => {
    try {
      sessionStorage.setItem("pantallaActual", pantalla);
    } catch {
      // La navegación continúa funcionando aunque el almacenamiento falle.
    }
  }, [pantalla]);


  const [avisoCierre, setAvisoCierre] = useState(false);

  const [sesion, setSesion] = useState(() => {
    try {
      const sesionGuardada = localStorage.getItem("sesion");
      return sesionGuardada ? JSON.parse(sesionGuardada) : null;
    } catch {
      localStorage.removeItem("sesion");
      return null;
    }
  });

  const handleLogout = async () => {
    // La sesión se borra al instante dentro de cerrarSesion();
    // la promesa devuelve el mensaje de confirmación del backend.
    const respuestaBackend = cerrarSesion();

    setSesion(null);       // limpia el estado de autenticación de la app
    setPantalla("login");  // vuelve al login, no a Inicio

    const mensaje = await respuestaBackend;
    // Si el backend no respondió, se usa un texto por defecto
    setAvisoCierre(mensaje || "Sesión cerrada correctamente.");
  };

  // La confirmación desaparece sola a los 4 segundos
  useEffect(() => {
    if (!avisoCierre) return;
    const t = setTimeout(() => setAvisoCierre(false), 4000);
    return () => clearTimeout(t);
  }, [avisoCierre]);

  // Si se cierra la sesión en otra pestaña, esta también se cierra
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "sesion" && e.newValue === null) {
        setSesion(null);
        setPantalla("login");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!sesion?.usuario || !sesion?.token) {

    if (pantalla === "registro") {
      return (
        <Registro
          onVolverLogin={() => setPantalla("login")}
          onVolverInicio={() => setPantalla("inicio")}
          onRegistroExitoso={(nuevaSesion) => {
            setAvisoCierre(false);
            setSesion(nuevaSesion);
          }}
        />
      );
    }

    if (pantalla === "inicio") {
      return (
        <Inicio
          onLogin={() => setPantalla("login")}
          onRegistro={() => setPantalla("registro")}
        />
      );
    }

    return (
      <div>
        {avisoCierre && (
          <div className="logout-toast" role="status" aria-live="polite">
            Sesión cerrada correctamente.
          </div>
        )}

        <Login
          onLogin={(nuevaSesion) => {
            setAvisoCierre(false);
            setSesion(nuevaSesion);
          }}
          onRegister={() => setPantalla("registro")}
          onVolverInicio={() => setPantalla("inicio")}
        />
      </div>
    );
  }

  return sesion.usuario.rol === "administrador" ? (
    <AdminPanel
      usuario={sesion.usuario}
      token={sesion.token}
      onLogout={handleLogout}
    />
  ) : (
    <FinancePanel usuario={sesion.usuario} onLogout={handleLogout} />
  );
}

export default App;