-- #####################################################################
-- ## TRADUCCIÓN A MYSQL - MODIFICAR TABLA `notificaciones` (v2)
-- #####################################################################
--
-- Explicación de Cambios:
-- 1. Lógica Simplificada: Se ha eliminado el bloque `DO $$...$$` y todas las sentencias de políticas (`DROP POLICY`, `CREATE POLICY`),
--    ya que no son aplicables en un entorno MySQL estándar.
-- 2. Sintaxis de MySQL: Se utiliza `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para añadir las columnas de forma idempotente (segura de ejecutar varias veces).
-- 3. Tipos de Datos: `UUID` se convierte en `VARCHAR(36)` y `BOOLEAN` se mantiene.
-- 4. Clave Foránea: La referencia a `auth.users(id)` se ha reemplazado por una clave foránea explícita que apunta a tu tabla `usuarios`.

-- --- Añadir columnas `resuelta` y `remitente_id` a la tabla `notificaciones` ---

ALTER TABLE `notificaciones`
  ADD COLUMN IF NOT EXISTS `resuelta` BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS `remitente_id` VARCHAR(36),
  ADD CONSTRAINT `fk_notificaciones_remitente_v2` -- Se usa un nombre de restricción único
    FOREIGN KEY IF NOT EXISTS (`remitente_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL;
