-- #####################################################################
-- ## TRADUCCIÓN A MYSQL - CREACIÓN DE TABLA `profesor_usuario`
-- #####################################################################
--
-- Explicación de Cambios:
-- 1. Tipos de Datos:
--    - `id UUID PRIMARY KEY ...`: Se ha cambiado a `INT AUTO_INCREMENT PRIMARY KEY`. Un simple número entero es más eficiente para una clave primaria interna que no se expone al usuario.
--    - `usuario_id UUID`: Se ha cambiado a `VARCHAR(36)` para que coincida con el tipo de la columna `id` en nuestra nueva tabla `usuarios`.
--    - `TIMESTAMP WITH TIME ZONE`: Se ha cambiado a `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.
-- 2. Claves Foráneas: Las restricciones de clave foránea se han definido directamente dentro de la sentencia `CREATE TABLE`, que es una práctica común y clara en MySQL.
-- 3. Comentarios: La sintaxis `COMMENT ON ...` no es estándar en todos los motores de MySQL y a menudo se ignora. Es más seguro y compatible añadir los comentarios directamente en el script con `--`.

CREATE TABLE IF NOT EXISTS `profesor_usuario` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `profesor_id` INT NOT NULL COMMENT 'ID del profesor asociado',
  `usuario_id` VARCHAR(36) NOT NULL COMMENT 'ID del usuario que tiene acceso al profesor',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Restricción para asegurar que no haya asociaciones duplicadas
  UNIQUE KEY `uq_profesor_usuario` (`profesor_id`, `usuario_id`),

  -- Definición de las claves foráneas
  CONSTRAINT `fk_profesor_usuario_profesor`
    FOREIGN KEY (`profesor_id`) REFERENCES `profesores`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_profesor_usuario_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) COMMENT='Tabla de asociación que permite a los usuarios acceder a profesores creados por otros usuarios.';

-- --- Índices para mejorar el rendimiento de las consultas ---
CREATE INDEX IF NOT EXISTS `idx_profesor_usuario_profesor_id` ON `profesor_usuario`(`profesor_id`);
CREATE INDEX IF NOT EXISTS `idx_profesor_usuario_usuario_id` ON `profesor_usuario`(`usuario_id`);
