
import { useState } from "react";
import "./Login.css";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

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
  };

  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    console.log("Datos del login:", formData);
  };

  return (
    <main className="login-container">
      <section className="login-card">
        <h1>Bienvenido</h1>

        <p>Ingresa a tu gestor de finanzas personales</p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Correo electrónico</label>

          <input
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
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {errors.password && (
            <span className="error-message" id="password-error">
              {errors.password}
            </span>
          )}

          <button type="submit" className="login-button">
            Iniciar sesión
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
