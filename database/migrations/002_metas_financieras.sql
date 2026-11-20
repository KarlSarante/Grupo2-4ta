USE finanzas_personales;

CREATE TABLE IF NOT EXISTS presupuestos_mensuales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    categoria_id INT NOT NULL,
    mes CHAR(7) NOT NULL,
    monto_limite DECIMAL(12,2) NOT NULL,
    umbral_medio TINYINT NOT NULL DEFAULT 50,
    umbral_alto TINYINT NOT NULL DEFAULT 80,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_presupuesto_usuario_categoria_mes
        UNIQUE (usuario_id, categoria_id, mes),
    CONSTRAINT fk_presupuesto_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_presupuesto_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias_generales(id),
    CONSTRAINT chk_presupuesto_monto CHECK (monto_limite > 0),
    CONSTRAINT chk_presupuesto_umbral_medio
        CHECK (umbral_medio > 0 AND umbral_medio < 100),
    CONSTRAINT chk_presupuesto_umbral_alto
        CHECK (umbral_alto > umbral_medio AND umbral_alto <= 100)
);

CREATE TABLE IF NOT EXISTS notificaciones_presupuesto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    presupuesto_id INT NOT NULL,
    nivel TINYINT NOT NULL,
    gastado DECIMAL(12,2) NOT NULL,
    monto_limite DECIMAL(12,2) NOT NULL,
    mes CHAR(7) NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_notificacion_presupuesto_nivel_mes
        UNIQUE (presupuesto_id, nivel, mes),
    CONSTRAINT fk_notificacion_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_notificacion_presupuesto
        FOREIGN KEY (presupuesto_id) REFERENCES presupuestos_mensuales(id) ON DELETE CASCADE
);
