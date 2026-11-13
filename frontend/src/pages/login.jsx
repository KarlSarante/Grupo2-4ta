import { useRef, useState } from "react";
import { iniciarSesion } from "../services/authService.js";
import "./login.css";

function Login({ onLogin, onRegister, onVolverInicio }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Validar los datos del formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Ingresa un correo electrónico válido.";
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = "La contraseña es obligatoria.";
    }

    setErrors(newErrors);

    if (newErrors.email) {
      emailRef.current?.focus();
    } else if (newErrors.password) {
      passwordRef.current?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  // Actualizar los campos
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Actualizar los errores mientras el usuario corrige
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
    setServerError("");
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    setServerError("");
    setLoading(true);

    try {
      const datos = await iniciarSesion(formData);
      localStorage.setItem("sesion", JSON.stringify(datos));
      onLogin(datos);
    } catch (error) {
      setServerError(
        error.message || "No se pudo iniciar sesión."
      );

      passwordRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container">
      <section className="login-card">
        <strong className="auth-brand">fintrack</strong>
        <h1>Bienvenido</h1>

        <p>Ingresa a tu gestor de finanzas personales</p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Correo electrónico</label>

          <input
            ref={emailRef}
            type="email"
            id="email"
            name="email"
            placeholder="ejemplo@correo.com"
            value={formData.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />

          {errors.email && (
            <span className="error-message" id="email-error">
              {errors.email}
            </span>
          )}

          <label htmlFor="password">Contraseña</label>

          <div className="password-container">
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="Ingresa tu contraseña"
              value={formData.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "password-error" : undefined
              }
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
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
            <span className="error-message" id="password-error">
              {errors.password}
            </span>
          )}

          {serverError && <span className="error-message">{serverError}</span>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <button type="button" className="register-link" onClick={onRegister}>
          ¿No tienes cuenta? Regístrate
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

export default Login;
