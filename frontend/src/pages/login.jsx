
import { useState } from "react";
import "./Login.css";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    console.log("Datos del login:", formData);
  };

  return (
    <main className="login-container">
      <section className="login-card">

        <h1>Bienvenido</h1>

        <p>
          Ingresa a tu gestor de finanzas personales
        </p>

        <form onSubmit={handleSubmit}>

          <label htmlFor="email">
            Correo electrónico
          </label>

          <input
            type="email"
            id="email"
            name="email"
            placeholder="ejemplo@correo.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="password">
            Contraseña
          </label>

          <div className="password-container">

            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="Ingresa tu contraseña"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>

          </div>

          <button type="submit" className="login-button">
            Iniciar sesión
          </button>

        </form>

      </section>
    </main>
  );
}

export default Login;
