-- Ejecutar una vez sobre instalaciones existentes.
ALTER TABLE categorias_generales
    ADD COLUMN usuario_id INT NULL AFTER id,
    ADD CONSTRAINT fk_categoria_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE;
