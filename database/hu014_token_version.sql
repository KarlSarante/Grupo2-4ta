-- FINTRACK V12 - HU-014
-- Agregar version de seguridad para invalidacion global de JWT.
-- MySQL 8.4 - Migracion idempotente.

USE finanzas_personales;

SET @columna_existe = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuarios'
      AND COLUMN_NAME = 'token_version'
);

SET @sql_migracion = IF(
    @columna_existe = 0,
    'ALTER TABLE usuarios ADD COLUMN token_version INT NOT NULL DEFAULT 1',
    'SELECT ''token_version ya existe; sin cambios'' AS resultado'
);

PREPARE migracion FROM @sql_migracion;
EXECUTE migracion;
DEALLOCATE PREPARE migracion;