-- #####################################################################
-- ## TRADUCCIÓN A MYSQL - AÑADIR COLUMNA `carrera_id`
-- #####################################################################
--
-- Explicación de Cambios:
-- 1. Eliminación de la Función y Bloques DO: La función `column_exists` y los bloques `DO $$...$$` son específicos de PostgreSQL.
--    Se han eliminado por completo.
-- 2. ALTER TABLE ... ADD COLUMN IF NOT EXISTS: Se utiliza la sintaxis moderna de MySQL para añadir una columna solo si no existe,
--    lo que cumple el mismo propósito que la lógica original de una manera más simple.
-- 3. Definición Explícita de Clave Foránea: La sentencia `REFERENCES` se ha separado en una restricción `FOREIGN KEY` explícita
--    para mayor claridad y compatibilidad.
-- 4. CREATE INDEX IF NOT EXISTS: La sintaxis para crear índices es compatible y se mantiene.

-- --- Añadir columna y clave foránea a asignaciones_enero_abril ---

ALTER TABLE `asignaciones_enero_abril`
  ADD COLUMN IF NOT EXISTS `carrera_id` INT,
  ADD CONSTRAINT `fk_asignaciones_ea_carrera`
    FOREIGN KEY IF NOT EXISTS (`carrera_id`) REFERENCES `carreras`(`id`) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS `idx_asignaciones_ea_carrera_id` ON `asignaciones_enero_abril`(`carrera_id`);


-- --- Añadir columna y clave foránea a asignaciones_mayo_agosto ---

ALTER TABLE `asignaciones_mayo_agosto`
  ADD COLUMN IF NOT EXISTS `carrera_id` INT,
  ADD CONSTRAINT `fk_asignaciones_ma_carrera`
    FOREIGN KEY IF NOT EXISTS (`carrera_id`) REFERENCES `carreras`(`id`) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS `idx_asignaciones_ma_carrera_id` ON `asignaciones_mayo_agosto`(`carrera_id`);


-- --- Añadir columna y clave foránea a asignaciones_septiembre_diciembre ---

ALTER TABLE `asignaciones_septiembre_diciembre`
  ADD COLUMN IF NOT EXISTS `carrera_id` INT,
  ADD CONSTRAINT `fk_asignaciones_sd_carrera`
    FOREIGN KEY IF NOT EXISTS (`carrera_id`) REFERENCES `carreras`(`id`) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS `idx_asignaciones_sd_carrera_id` ON `asignaciones_septiembre_diciembre`(`carrera_id`);
