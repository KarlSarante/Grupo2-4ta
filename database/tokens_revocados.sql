-- Tokens que ya no deben aceptarse aunque su firma y expiración sean válidas.
-- Cambia INT por el tipo real de usuarios.id (por ejemplo INT UNSIGNED).
USE finanzas_personales;

CREATE TABLE IF NOT EXISTS tokens_revocados (
  jti         CHAR(36) NOT NULL PRIMARY KEY,           -- identificador único del token
  usuario_id  INT      NOT NULL,
  expira_en   DATETIME NOT NULL,                       -- cuándo vence el token (para limpiar)
  revocado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tokens_revocados_expira_en (expira_en)
);
