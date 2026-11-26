-- FINTRACK - Alinear el esquema financiero existente con schema.sql.
-- MySQL 8.4 - Cambios aditivos e idempotentes.

USE finanzas_personales;

SET @columna_activo_existe = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'categorias_generales'
      AND COLUMN_NAME = 'activo'
);

SET @sql_categoria = IF(
    @columna_activo_existe = 0,
    'ALTER TABLE categorias_generales ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE AFTER tipo',
    'SELECT ''La columna activo ya existe; sin cambios'' AS resultado'
);

PREPARE migracion_categoria FROM @sql_categoria;
EXECUTE migracion_categoria;
DEALLOCATE PREPARE migracion_categoria;

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
