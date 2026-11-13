import { useRef, useState } from "react";
import { registrarUsuario, iniciarSesion } from "../services/authService.js";
import "./login.css";

function Registro({ onVolverLogin, onRegistroExitoso, onVolverInicio }) {
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const nombreRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmarPasswordRef = useRef(null);

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

    if (!formData.confirmarPassword) {
      newErrors.confirmarPassword = "Debes confirmar tu contraseña.";
    } else if (formData.confirmarPassword !== formData.password) {
      newErrors.confirmarPassword = "Las contraseñas no coinciden.";
    }

    setErrors(newErrors);

    if (newErrors.nombre) {
      nombreRef.current?.focus();
    } else if (newErrors.email) {
      emailRef.current?.focus();
    } else if (newErrors.password) {
      passwordRef.current?.focus();
    } else if (newErrors.confirmarPassword) {
      confirmarPasswordRef.current?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading || !validateForm()) return;

    setLoading(true);
    setServerError("");
    setSuccessMessage("");

    const nombre = formData.nombre.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    let registroCompletado = false;

    try {
      // 1. Crear la cuenta.
      await registrarUsuario({
        nombre,
        email,
        password,
      });

      registroCompletado = true;

      // 2. Iniciar sesión automáticamente.
      const datos = await iniciarSesion({
        email,
        password,
      });

      // 3. Comprobar que el backend devolvió una sesión válida.
      if (!datos?.usuario || !datos?.token) {
        throw new Error("El servidor no devolvió una sesión válida.");
      }

      // 4. Guardar la sesión.
      localStorage.setItem("sesion", JSON.stringify(datos));

      // 5. Notificar a App.jsx para mostrar el panel correspondiente.
      onRegistroExitoso(datos);
    } catch (error) {
      if (registroCompletado) {
        // La cuenta existe, pero el inicio de sesión automático falló.
        setSuccessMessage("Tu cuenta fue creada correctamente.");
        setServerError(
          "No se pudo iniciar sesión automáticamente. " +
          "Puedes utilizar el botón 'Ir a iniciar sesión'."
        );
      } else {
        setServerError(
          error.message || "No se pudo completar el registro."
        );
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="login-container registro-container">
      <section className="login-card">
        <strong className="auth-brand">fintrack</strong>
        <h1>Crear cuenta</h1>
        <p>Regístrate en tu gestor de finanzas personales</p>

        {successMessage && (
          <p role="status">{successMessage}</p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="registro-nombre">Nombre completo</label>
          <input
            ref={nombreRef}
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
            ref={emailRef}
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
              ref={passwordRef}
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
              aria-label={
                showPassword ? "Ocultar contraseñas" : "Mostrar contraseñas"
              }
              aria-pressed={showPassword}
              disabled={loading || Boolean(successMessage)}
            >
              {showPassword ? (
                <svg
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
                  <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c5 0 9.3 3.1 11 7a11.6 11.6 0 0 1-4.2 5.2" />
                  <path d="M6.6 6.6A11.6 11.6 0 0 0 1 12c1.7 3.9 6 7 11 7 1.7 0 3.3-.4 4.7-1.1" />
                  <path d="M10 10a2.8 2.8 0 0 0 4 4" />
                  <path d="M3 3l18 18" />
                </svg>
              ) : (
                <svg
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
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <span className="error-message">{errors.password}</span>
          )}


          <label htmlFor="registro-confirmar">Confirmar contraseña</label>

          <div className="password-container">
            <input
              ref={confirmarPasswordRef}
              id="registro-confirmar"
              name="confirmarPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirmarPassword}
              onChange={handleChange}
              disabled={loading || Boolean(successMessage)}
              aria-invalid={Boolean(errors.confirmarPassword)}
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={
                showConfirmPassword
                  ? "Ocultar confirmación de contraseña"
                  : "Mostrar confirmación de contraseña"
              }
              aria-pressed={showConfirmPassword}
              disabled={loading || Boolean(successMessage)}
            >
              {showConfirmPassword ? (
                <svg
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
                  <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c5 0 9.3 3.1 11 7a11.6 11.6 0 0 1-4.2 5.2" />
                  <path d="M6.6 6.6A11.6 11.6 0 0 0 1 12c1.7 3.9 6 7 11 7 1.7 0 3.3-.4 4.7-1.1" />
                  <path d="M10 10a2.8 2.8 0 0 0 4 4" />
                  <path d="M3 3l18 18" />
                </svg>
              ) : (
                <svg
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
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {errors.confirmarPassword && (
            <span className="error-message">
              {errors.confirmarPassword}
            </span>
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
          className="register-link"
          onClick={onVolverLogin}
        >
          {successMessage ? "Ir a iniciar sesión" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>

        <button
          type="button"
          className="register-link"
          onClick={onVolverInicio}
        >
          ← Volver al inicio
        </button>
      </section>
    </main>
  );
}

export default Registro;
