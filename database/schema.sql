-- ==================================================
-- Proyecto: Finanzas Personales
-- Base de datos: finanzas_personales
-- Historia de usuario: HU-001.1
-- ==================================================

-- Crear la base de datos si todavía no existe.
CREATE DATABASE IF NOT EXISTS finanzas_personales
CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

-- Seleccionar la base de datos.
USE finanzas_personales;

-- Crear la tabla de usuarios si todavía no existe.
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'administrador') NOT NULL DEFAULT 'usuario',
    activo BOOLEAN NOT NULL DEFAULT TRUE
);


-- ==================================================
-- Limite global de gastos por usuario
-- Tabla: limites_gastos
-- ==================================================

CREATE TABLE IF NOT EXISTS limites_gastos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_limites_gastos_usuario
        UNIQUE (usuario_id),
    CONSTRAINT fk_limites_gastos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_limites_gastos_monto
        CHECK (monto > 0)
);


-- ==================================================
-- Sprint 2 - HU016
-- Tabla: categorias_generales
-- ==================================================

CREATE TABLE IF NOT EXISTS categorias_generales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('ingreso', 'gasto') NOT NULL,
    usuario_id INT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    -- La columna generada solo participa en la unicidad de categorías generales.
    nombre_general VARCHAR(100)
        GENERATED ALWAYS AS (CASE WHEN usuario_id IS NULL THEN nombre ELSE NULL END) VIRTUAL,
    CONSTRAINT uq_categoria_general UNIQUE (nombre_general, tipo),
    CONSTRAINT uq_categoria_personal UNIQUE (usuario_id, nombre, tipo),
    CONSTRAINT fk_categoria_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
);


-- ==================================================
-- Sprint 2 - HU004 / HU005 / HU006
-- Tabla: transacciones
-- ==================================================

CREATE TABLE IF NOT EXISTS transacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    categoria_id INT NOT NULL,
    tipo ENUM('ingreso', 'gasto') NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    fecha DATE NOT NULL,
    descripcion VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transaccion_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_transaccion_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias_generales(id),

    CONSTRAINT chk_transaccion_monto
        CHECK (monto > 0)
);

-- ==================================================
-- PRESUPUESTOS
-- Definiciones sincronizadas desde migracion 002
-- ==================================================

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
    CONSTRAINT uq_presupuesto_id_usuario
        UNIQUE (id, usuario_id),
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
    CONSTRAINT fk_notificacion_presupuesto_propietario
        FOREIGN KEY (presupuesto_id, usuario_id)
        REFERENCES presupuestos_mensuales(id, usuario_id) ON DELETE CASCADE
);

-- ==================================================
-- Metas financieras
-- Tabla: objetivos_financieros
-- ==================================================

CREATE TABLE IF NOT EXISTS objetivos_financieros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    monto_objetivo DECIMAL(12,2) NOT NULL,
    monto_actual DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    fecha_limite DATE NULL,
    estado ENUM('activo', 'completado', 'cancelado')
        NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_objetivo_id_usuario
        UNIQUE (id, usuario_id),

    CONSTRAINT fk_objetivo_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_objetivo_monto
        CHECK (monto_objetivo > 0),

    CONSTRAINT chk_objetivo_actual
        CHECK (monto_actual >= 0),

    INDEX idx_objetivo_usuario_estado
        (usuario_id, estado, created_at)
) ENGINE=InnoDB;


-- ==================================================
-- Aportaciones a metas financieras
-- Tabla: aportaciones_objetivo
-- ==================================================

CREATE TABLE IF NOT EXISTS aportaciones_objetivo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    objetivo_id INT NOT NULL,
    usuario_id INT NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    fecha DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_aportacion_objetivo_usuario
        FOREIGN KEY (objetivo_id, usuario_id)
        REFERENCES objetivos_financieros(id, usuario_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_aportacion_monto
        CHECK (monto > 0),

    INDEX idx_aportacion_objetivo_fecha
        (objetivo_id, fecha, id),

    INDEX idx_aportacion_usuario
        (usuario_id)
) ENGINE=InnoDB;
