function AdminPanel({ usuario, onLogout }) {
  return (
    <main className="role-panel">
      <section className="role-card">
        <p className="role-label">Panel administrativo</p>
        <h1>Bienvenido, {usuario.nombre}</h1>
        <p>Desde aquí puedes administrar los usuarios y la configuración del sistema.</p>
        <button type="button" onClick={onLogout}>Cerrar sesión</button>
      </section>
    </main>
  );
}

export default AdminPanel;
