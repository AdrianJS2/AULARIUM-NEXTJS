-- #####################################################################
-- ## TRADUCCIÓN A MYSQL - AÑADIR COLUMNA DE DISPONIBILIDAD
-- #####################################################################
--
-- Explicación de Cambios:
-- 1. ALTER TABLE: Se utiliza una única sentencia `ALTER TABLE` para añadir la columna.
-- 2. JSONB -> JSON: El tipo de dato `JSONB` de PostgreSQL se traduce a `JSON` en MySQL.
-- 3. COMMENT: El comentario de la columna se añade directamente en la definición de la columna, que es la sintaxis estándar de MySQL.
-- 4. Índice GIN Eliminado: El índice `USING GIN` es específico de PostgreSQL para JSON y no tiene un equivalente directo en MySQL. Se ha omitido, ya que para la mayoría de los casos de uso no es estrictamente necesario, y se puede añadir un índice específico para JSON más adelante si el rendimiento lo requiere.
-- 5. Política de Seguridad Eliminada: La sentencia `ALTER POLICY` es parte del sistema de Row Level Security (RLS) de Supabase/PostgreSQL y no aplica en MySQL. Se ha eliminado por completo.

ALTER TABLE `profesores`
  ADD COLUMN IF NOT EXISTS `disponibilidad` JSON COMMENT 'Almacena la disponibilidad del profesor por día y hora en formato JSON';

