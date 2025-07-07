-- #####################################################################
-- ## TRADUCCIÓN A MYSQL - ESQUEMA DE TABLAS POR PERIODO
-- #####################################################################
--
-- Explicación de Cambios:
-- 1. SERIAL PRIMARY KEY -> INT AUTO_INCREMENT PRIMARY KEY: Es la sintaxis estándar de MySQL para claves primarias autoincrementales.
-- 2. REFERENCES ... -> FOREIGN KEY (...) REFERENCES ...: Aunque MySQL a menudo infiere la clave foránea, la sintaxis explícita es más robusta y clara.
-- 3. TIMESTAMP WITH TIME ZONE -> TIMESTAMP: Se ha cambiado a TIMESTAMP, que en MySQL maneja la zona horaria de manera implícita.
-- 4. DEFAULT TIMEZONE(...) -> DEFAULT CURRENT_TIMESTAMP: Es el equivalente en MySQL para establecer la fecha y hora actual por defecto.
-- 5. JSONB -> JSON: MySQL tiene un tipo de dato JSON nativo que es el equivalente directo.
-- 6. CREATE INDEX: La sintaxis para crear índices es la misma y se ha mantenido.

-- --- Tablas para Enero-Abril (Periodo 1) ---

CREATE TABLE IF NOT EXISTS materias_enero_abril (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` TEXT NOT NULL,
  `profesor_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`profesor_id`) REFERENCES `profesores`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS grupos_enero_abril (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `materia_id` INT,
  `numero` TEXT NOT NULL,
  `alumnos` INT NOT NULL,
  `turno` TEXT NOT NULL,
  `horarios` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`materia_id`) REFERENCES `materias_enero_abril`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asignaciones_enero_abril (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `grupo_id` INT,
  `aula_id` INT,
  `materia_id` INT,
  `dia` TEXT NOT NULL,
  `hora_inicio` TEXT NOT NULL,
  `hora_fin` TEXT NOT NULL,
  `turno` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`grupo_id`) REFERENCES `grupos_enero_abril`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`aula_id`) REFERENCES `aulas`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`materia_id`) REFERENCES `materias_enero_abril`(`id`) ON DELETE CASCADE
);

-- --- Tablas para Mayo-Agosto (Periodo 2) ---

CREATE TABLE IF NOT EXISTS materias_mayo_agosto (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` TEXT NOT NULL,
  `profesor_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`profesor_id`) REFERENCES `profesores`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS grupos_mayo_agosto (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `materia_id` INT,
  `numero` TEXT NOT NULL,
  `alumnos` INT NOT NULL,
  `turno` TEXT NOT NULL,
  `horarios` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`materia_id`) REFERENCES `materias_mayo_agosto`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asignaciones_mayo_agosto (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `grupo_id` INT,
  `aula_id` INT,
  `materia_id` INT,
  `dia` TEXT NOT NULL,
  `hora_inicio` TEXT NOT NULL,
  `hora_fin` TEXT NOT NULL,
  `turno` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`grupo_id`) REFERENCES `grupos_mayo_agosto`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`aula_id`) REFERENCES `aulas`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`materia_id`) REFERENCES `materias_mayo_agosto`(`id`) ON DELETE CASCADE
);

-- --- Tablas para Septiembre-Diciembre (Periodo 3) ---

CREATE TABLE IF NOT EXISTS materias_septiembre_diciembre (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` TEXT NOT NULL,
  `profesor_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`profesor_id`) REFERENCES `profesores`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS grupos_septiembre_diciembre (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `materia_id` INT,
  `numero` TEXT NOT NULL,
  `alumnos` INT NOT NULL,
  `turno` TEXT NOT NULL,
  `horarios` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`materia_id`) REFERENCES `materias_septiembre_diciembre`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asignaciones_septiembre_diciembre (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `grupo_id` INT,
  `aula_id` INT,
  `materia_id` INT,
  `dia` TEXT NOT NULL,
  `hora_inicio` TEXT NOT NULL,
  `hora_fin` TEXT NOT NULL,
  `turno` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`grupo_id`) REFERENCES `grupos_septiembre_diciembre`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`aula_id`) REFERENCES `aulas`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`materia_id`) REFERENCES `materias_septiembre_diciembre`(`id`) ON DELETE CASCADE
);

-- --- Índices para mejorar el rendimiento (la sintaxis es compatible) ---

CREATE INDEX `idx_materias_ea_profesor` ON `materias_enero_abril`(`profesor_id`);
CREATE INDEX `idx_materias_ma_profesor` ON `materias_mayo_agosto`(`profesor_id`);
CREATE INDEX `idx_materias_sd_profesor` ON `materias_septiembre_diciembre`(`profesor_id`);

CREATE INDEX `idx_grupos_ea_materia` ON `grupos_enero_abril`(`materia_id`);
CREATE INDEX `idx_grupos_ma_materia` ON `grupos_mayo_agosto`(`materia_id`);
CREATE INDEX `idx_grupos_sd_materia` ON `grupos_septiembre_diciembre`(`materia_id`);

CREATE INDEX `idx_asignaciones_ea_grupo` ON `asignaciones_enero_abril`(`grupo_id`);
CREATE INDEX `idx_asignaciones_ma_grupo` ON `asignaciones_mayo_agosto`(`grupo_id`);
CREATE INDEX `idx_asignaciones_sd_grupo` ON `asignaciones_septiembre_diciembre`(`grupo_id`);
