
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
-- Sprint 2 - HU016
-- Tabla: categorias_generales
-- ==================================================

CREATE TABLE IF NOT EXISTS categorias_generales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('ingreso', 'gasto') NOT NULL,

    CONSTRAINT uq_categoria_nombre_tipo
        UNIQUE (nombre, tipo)
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
