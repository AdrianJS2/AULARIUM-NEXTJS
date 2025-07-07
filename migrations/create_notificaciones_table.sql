-- #####################################################################
-- ## TRADUCCIÓN A MYSQL - CREACIÓN DE TABLA `notificaciones`
-- #####################################################################
--
-- Explicación de Cambios:
-- 1. Tipos de Datos: Se han traducido los tipos de datos de PostgreSQL a sus equivalentes en MySQL:
--    - `SERIAL PRIMARY KEY` -> `INT AUTO_INCREMENT PRIMARY KEY`
--    - `JSONB` -> `JSON`
--    - `TIMESTAMP WITH TIME ZONE` -> `TIMESTAMP`
--    - `UUID` -> `VARCHAR(36)`
-- 2. Clave Foránea: La referencia a la tabla `auth.users` (de Supabase) se ha cambiado para apuntar a tu propia tabla `usuarios`.
-- 3. Lógica de Seguridad Eliminada: Se han eliminado por completo las sentencias `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
--    y todas las sentencias `CREATE POLICY`. Esta lógica de permisos deberá ser manejada por tu aplicación Next.js.
-- 4. Índices: La sintaxis para crear índices es compatible y se ha mantenido.

CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tipo` VARCHAR(50) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `datos` JSON,
  `leida` BOOLEAN DEFAULT FALSE,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `destinatario_id` VARCHAR(36) NOT NULL,
  CONSTRAINT `fk_notificaciones_destinatario`
    FOREIGN KEY (`destinatario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
);

-- --- Índices para mejorar el rendimiento ---
CREATE INDEX IF NOT EXISTS `idx_notificaciones_destinatario` ON `notificaciones`(`destinatario_id`);
CREATE INDEX IF NOT EXISTS `idx_notificaciones_leida` ON `notificaciones`(`leida`);
CREATE INDEX IF NOT EXISTS `idx_notificaciones_fecha` ON `notificaciones`(`fecha_creacion`);
