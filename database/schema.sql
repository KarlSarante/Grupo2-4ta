
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
