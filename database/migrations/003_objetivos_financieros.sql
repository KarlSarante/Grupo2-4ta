USE finanzas_personales;

CREATE TABLE IF NOT EXISTS objetivos_financieros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    monto_objetivo DECIMAL(12,2) NOT NULL,
    monto_actual DECIMAL(12,2) NOT NULL DEFAULT 0,
    fecha_limite DATE NULL,
    estado ENUM('activo', 'completado', 'cancelado') NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_objetivo_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_objetivo_monto
        CHECK (monto_objetivo > 0),
    CONSTRAINT chk_objetivo_actual
        CHECK (monto_actual >= 0)
);

CREATE TABLE IF NOT EXISTS aportaciones_objetivo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    objetivo_id INT NOT NULL,
    usuario_id INT NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    fecha DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_aportacion_objetivo
        FOREIGN KEY (objetivo_id) REFERENCES objetivos_financieros(id) ON DELETE CASCADE,
    CONSTRAINT fk_aportacion_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_aportacion_monto
        CHECK (monto > 0)
);
