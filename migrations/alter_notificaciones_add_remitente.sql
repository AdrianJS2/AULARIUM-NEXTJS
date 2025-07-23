-- #####################################################################
-- ## TRADUCCIÓN A MYSQL - MODIFICAR TABLA `notificaciones`
-- #####################################################################
--
-- Explicación de Cambios:
-- 1. Eliminación de Lógica PostgreSQL: Se ha eliminado el bloque `DO $$...$$` y todas las sentencias `DROP POLICY` y `CREATE POLICY`,
--    ya que son específicas de PostgreSQL y no tienen un equivalente directo en MySQL. La seguridad de acceso a los datos
--    deberá ser manejada por la lógica de la aplicación.
-- 2. Sintaxis de MySQL: Se utiliza `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para añadir las nuevas columnas de forma segura.
-- 3. Tipo de Dato UUID: El tipo `UUID` se ha cambiado a `VARCHAR(36)`, que es el tipo de dato recomendado para almacenar UUIDs en MySQL
--    para garantizar la compatibilidad.
-- 4. Clave Foránea: La referencia a `auth.users(id)` (una tabla de Supabase) se ha cambiado para apuntar a tu propia tabla `usuarios(id)`.
--    Esto asume que crearás una tabla `usuarios` con un `id` de tipo `VARCHAR(36)`.

-- --- Añadir columnas `remitente_id` y `resuelta` a la tabla de notificaciones ---

ALTER TABLE `notificaciones`
  ADD COLUMN IF NOT EXISTS `remitente_id` VARCHAR(36),
  ADD COLUMN IF NOT EXISTS `resuelta` BOOLEAN DEFAULT FALSE,
  ADD CONSTRAINT `fk_notificaciones_remitente`
    FOREIGN KEY IF NOT EXISTS (`remitente_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL;

