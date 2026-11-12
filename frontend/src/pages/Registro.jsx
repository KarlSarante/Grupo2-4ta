
import { useState } from "react";
import { registrarUsuario } from "../services/authService.js";
import "./login.css";

function Registro({ onVolverLogin }) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmarPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setServerError("");
  };

  const validateForm = () => {
    const newErrors = {};
    const nombre = formData.nombre.trim();
    const email = formData.email.trim();

    if (nombre.length < 2 || nombre.length > 100) {
      newErrors.nombre = "El nombre debe tener entre 2 y 100 caracteres.";
    }

    if (
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      newErrors.email = "Ingresa un correo electrónico válido.";
    }

    if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres.";
    } else if (new TextEncoder().encode(formData.password).length > 72) {
      newErrors.password = "La contraseña no puede superar los 72 bytes.";
    }

    if (formData.confirmarPassword !== formData.password) {
      newErrors.confirmarPassword = "Las contraseñas no coinciden.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setServerError("");
    setSuccessMessage("");

    try {
      const datos = await registrarUsuario({
        nombre: formData.nombre.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      setSuccessMessage(datos.mensaje || "Usuario registrado correctamente.");
      setFormData({
        nombre: "",
        email: "",
        password: "",
        confirmarPassword: "",
      });
      setErrors({});
    } catch (error) {
      setServerError(error.message || "No se pudo completar el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container">
      <section className="login-card">
        <h1>Crear cuenta</h1>
        <p>Regístrate en tu gestor de finanzas personales</p>

        {successMessage && (
          <p role="status">{successMessage}</p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="registro-nombre">Nombre completo</label>
          <input
            id="registro-nombre"
            name="nombre"
            type="text"
            autoComplete="name"
            value={formData.nombre}
            onChange={handleChange}
            disabled={loading || Boolean(successMessage)}
            aria-invalid={Boolean(errors.nombre)}
          />
          {errors.nombre && (
            <span className="error-message">{errors.nombre}</span>
          )}

          <label htmlFor="registro-email">Correo electrónico</label>
          <input
            id="registro-email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading || Boolean(successMessage)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <span className="error-message">{errors.email}</span>
          )}

          <label htmlFor="registro-password">Contraseña</label>
          <div className="password-container">
            <input
              id="registro-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading || Boolean(successMessage)}
              aria-invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          {errors.password && (
            <span className="error-message">{errors.password}</span>
          )}

          <label htmlFor="registro-confirmar">Confirmar contraseña</label>
          <input
            id="registro-confirmar"
            name="confirmarPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={formData.confirmarPassword}
            onChange={handleChange}
            disabled={loading || Boolean(successMessage)}
            aria-invalid={Boolean(errors.confirmarPassword)}
          />
          {errors.confirmarPassword && (
            <span className="error-message">{errors.confirmarPassword}</span>
          )}

          {serverError && (
            <span className="error-message" role="alert">
              {serverError}
            </span>
          )}

          {!successMessage && (
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>
          )}
        </form>

        <button
          type="button"
          className="login-button"
          onClick={onVolverLogin}
        >
          {successMessage ? "Ir a iniciar sesión" : "Volver al inicio de sesión"}
        </button>
      </section>
    </main>
  );
}

export default Registro;
