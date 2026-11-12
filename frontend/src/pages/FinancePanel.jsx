function FinancePanel({ usuario, onLogout }) {
  return (
    <main className="role-panel">
      <section className="role-card">
        <p className="role-label">Panel financiero</p>
        <h1>Bienvenido, {usuario.nombre}</h1>
        <p>Desde aquí puedes gestionar tus ingresos, gastos y resumen financiero.</p>
        <button type="button" onClick={onLogout}>Cerrar sesión</button>
      </section>
    </main>
  );
}

export default FinancePanel;
