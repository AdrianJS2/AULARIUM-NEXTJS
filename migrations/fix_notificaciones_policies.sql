-- #####################################################################
-- ## TRADUCCIÓN A MYSQL - MODIFICAR TABLA `notificaciones` (fix_policies)
-- #####################################################################
--
-- Explicación de Cambios:
-- 1. Lógica de PostgreSQL Eliminada: Se han eliminado todas las sentencias `DROP POLICY`, `CREATE POLICY` y el bloque `DO $$...$$`,
--    ya que no son compatibles con MySQL.
-- 2. Sintaxis de MySQL: Se utiliza `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para añadir las columnas, asegurando que el script
--    se pueda ejecutar de forma segura varias veces.
-- 3. Tipos de Datos Corregidos:
--    - `UUID` se ha cambiado a `VARCHAR(36)`.
--    - `BOOLEAN` se mantiene, ya que es válido en MySQL.
-- 4. Clave Foránea: La referencia a `auth.users(id)` se ha reemplazado por una clave foránea explícita que apunta a la tabla `usuarios`
--    que definimos anteriormente.

-- --- Añadir columnas `remitente_id` y `resuelta` a la tabla de notificaciones ---

ALTER TABLE `notificaciones`
  ADD COLUMN IF NOT EXISTS `remitente_id` VARCHAR(36),
  ADD COLUMN IF NOT EXISTS `resuelta` BOOLEAN DEFAULT FALSE;

-- --- Añadir la restricción de clave foránea si no existe ---
-- Se añade por separado para mayor claridad y control.

ALTER TABLE `notificaciones`
  ADD CONSTRAINT `fk_notificaciones_remitente_fix_policies`
    FOREIGN KEY IF NOT EXISTS (`remitente_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL;

