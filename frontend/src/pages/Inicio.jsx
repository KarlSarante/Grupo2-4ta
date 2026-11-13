import "./inicio.css";

function Inicio({ onLogin, onRegistro }) {
  return (
    <main className="inicio-container">
      <header className="inicio-header">
        <strong className="inicio-brand">fintrack</strong>
        <button type="button" className="inicio-login-button" onClick={onLogin}>
          Iniciar sesión
        </button>
      </header>

      <div className="inicio-layout">
        <section className="inicio-content">
          <p className="inicio-eyebrow">TUS FINANZAS, CON CLARIDAD</p>
          <h1>Menos dudas.<br />Más control<br />de tu dinero.</h1>
          <p className="inicio-description">
            Registra tus movimientos y entiende tu mes, sin perder de vista lo
            que importa.
          </p>

          <div className="inicio-actions">
            <button type="button" className="inicio-primary-action" onClick={onRegistro}>
              Comenzar ahora
            </button>

            <span>Tu información, siempre en orden.</span>
          </div>
        </section>

        <aside className="inicio-preview" aria-label="Vista previa del resumen financiero">
          <div className="preview-header">
            <span>Resumen mensual</span>
            <span>Nov 2026</span>
          </div>
          <p className="preview-label">BALANCE DISPONIBLE</p>
          <strong className="preview-total">RD$ 21,500</strong>
          <div className="preview-divider" />
          <div className="preview-row">
            <span><i className="preview-dot income-dot" />Ingresos</span>
            <strong>RD$ 25,000</strong>
          </div>
          <div className="preview-row">
            <span><i className="preview-dot expense-dot" />Gastos</span>
            <strong>RD$ 3,500</strong>
          </div>
          <div className="preview-chart">
            <span style={{ height: "38%" }} />
            <span style={{ height: "62%" }} />
            <span style={{ height: "48%" }} />
            <span style={{ height: "82%" }} />
            <span style={{ height: "70%" }} />
            <span style={{ height: "94%" }} />
          </div>
        </aside>
      </div>

      <p className="inicio-footer">Personal. Organizado. Solo tuyo.</p>
    </main>
  );
}

export default Inicio;
