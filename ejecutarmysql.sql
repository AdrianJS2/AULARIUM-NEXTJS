-- #####################################################################
-- ## SCRIPT DE BASE DE DATOS COMPLETO PARA AULARIUM (MySQL)
-- #####################################################################
--
-- Instrucciones: Ejecute este script completo en su servidor MySQL
-- para crear todas las tablas, relaciones e índices necesarios.

-- --- Creación de Tablas Base ---

CREATE TABLE IF NOT EXISTS `carreras` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` VARCHAR(36) PRIMARY KEY, -- Usaremos VARCHAR para UUIDs
  `nombre` VARCHAR(255),
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `rol` VARCHAR(50) NOT NULL DEFAULT 'usuario',
  `carrera_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`carrera_id`) REFERENCES `carreras`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `profesores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE,
  `disponibilidad` JSON COMMENT 'Almacena la disponibilidad del profesor por día y hora',
  `usuario_id` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `aulas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL,
  `capacidad` INT NOT NULL,
  `equipamiento` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `periodos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL,
  `fecha_inicio` DATE,
  `fecha_fin` DATE
);

CREATE TABLE IF NOT EXISTS `profesor_usuario` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `profesor_id` INT NOT NULL,
  `usuario_id` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(`profesor_id`, `usuario_id`),
  FOREIGN KEY (`profesor_id`) REFERENCES `profesores`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tipo` VARCHAR(50) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `datos` JSON,
  `leida` BOOLEAN DEFAULT FALSE,
  `resuelta` BOOLEAN DEFAULT FALSE,
  `destinatario_id` VARCHAR(36) NOT NULL,
  `remitente_id` VARCHAR(36),
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`destinatario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`remitente_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
);


-- --- Inserción de Datos Iniciales ---

INSERT IGNORE INTO `periodos` (`id`, `nombre`, `fecha_inicio`, `fecha_fin`) VALUES
(1, 'Enero-Abril', '2025-01-01', '2025-04-30'),
(2, 'Mayo-Agosto', '2025-05-01', '2025-08-31'),
(3, 'Septiembre-Diciembre', '2025-09-01', '2025-12-31');


-- --- Creación de Tablas por Periodo ---

-- Tablas para Enero-Abril
CREATE TABLE IF NOT EXISTS `materias_enero_abril` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `nombre` TEXT NOT NULL, `profesor_id` INT, `carrera_id` INT, `usuario_id` VARCHAR(36), `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`profesor_id`) REFERENCES `profesores`(`id`) ON DELETE SET NULL, FOREIGN KEY (`carrera_id`) REFERENCES `carreras`(`id`) ON DELETE SET NULL, FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS `grupos_enero_abril` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `materia_id` INT, `numero` TEXT NOT NULL, `alumnos` INT NOT NULL, `turno` TEXT NOT NULL, `horarios` JSON, `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`materia_id`) REFERENCES `materias_enero_abril`(`id`) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS `asignaciones_enero_abril` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `grupo_id` INT, `aula_id` INT, `materia_id` INT, `carrera_id` INT, `dia` TEXT NOT NULL, `hora_inicio` TEXT NOT NULL, `hora_fin` TEXT NOT NULL, `turno` TEXT NOT NULL, `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`grupo_id`) REFERENCES `grupos_enero_abril`(`id`) ON DELETE CASCADE, FOREIGN KEY (`aula_id`) REFERENCES `aulas`(`id`) ON DELETE SET NULL, FOREIGN KEY (`materia_id`) REFERENCES `materias_enero_abril`(`id`) ON DELETE CASCADE, FOREIGN KEY (`carrera_id`) REFERENCES `carreras`(`id`) ON DELETE SET NULL
);

-- Tablas para Mayo-Agosto
CREATE TABLE IF NOT EXISTS `materias_mayo_agosto` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `nombre` TEXT NOT NULL, `profesor_id` INT, `carrera_id` INT, `usuario_id` VARCHAR(36), `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`profesor_id`) REFERENCES `profesores`(`id`) ON DELETE SET NULL, FOREIGN KEY (`carrera_id`) REFERENCES `carreras`(`id`) ON DELETE SET NULL, FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS `grupos_mayo_agosto` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `materia_id` INT, `numero` TEXT NOT NULL, `alumnos` INT NOT NULL, `turno` TEXT NOT NULL, `horarios` JSON, `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`materia_id`) REFERENCES `materias_mayo_agosto`(`id`) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS `asignaciones_mayo_agosto` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `grupo_id` INT, `aula_id` INT, `materia_id` INT, `carrera_id` INT, `dia` TEXT NOT NULL, `hora_inicio` TEXT NOT NULL, `hora_fin` TEXT NOT NULL, `turno` TEXT NOT NULL, `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`grupo_id`) REFERENCES `grupos_mayo_agosto`(`id`) ON DELETE CASCADE, FOREIGN KEY (`aula_id`) REFERENCES `aulas`(`id`) ON DELETE SET NULL, FOREIGN KEY (`materia_id`) REFERENCES `materias_mayo_agosto`(`id`) ON DELETE CASCADE, FOREIGN KEY (`carrera_id`) REFERENCES `carreras`(`id`) ON DELETE SET NULL
);

-- Tablas para Septiembre-Diciembre
CREATE TABLE IF NOT EXISTS `materias_septiembre_diciembre` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `nombre` TEXT NOT NULL, `profesor_id` INT, `carrera_id` INT, `usuario_id` VARCHAR(36), `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`profesor_id`) REFERENCES `profesores`(`id`) ON DELETE SET NULL, FOREIGN KEY (`carrera_id`) REFERENCES `carreras`(`id`) ON DELETE SET NULL, FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS `grupos_septiembre_diciembre` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `materia_id` INT, `numero` TEXT NOT NULL, `alumnos` INT NOT NULL, `turno` TEXT NOT NULL, `horarios` JSON, `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`materia_id`) REFERENCES `materias_septiembre_diciembre`(`id`) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS `asignaciones_septiembre_diciembre` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `grupo_id` INT, `aula_id` INT, `materia_id` INT, `carrera_id` INT, `dia` TEXT NOT NULL, `hora_inicio` TEXT NOT NULL, `hora_fin` TEXT NOT NULL, `turno` TEXT NOT NULL, `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`grupo_id`) REFERENCES `grupos_septiembre_diciembre`(`id`) ON DELETE CASCADE, FOREIGN KEY (`aula_id`) REFERENCES `aulas`(`id`) ON DELETE SET NULL, FOREIGN KEY (`materia_id`) REFERENCES `materias_septiembre_diciembre`(`id`) ON DELETE CASCADE, FOREIGN KEY (`carrera_id`) REFERENCES `carreras`(`id`) ON DELETE SET NULL
);


-- --- Creación de Índices para mejorar el rendimiento ---

CREATE INDEX IF NOT EXISTS `idx_materias_ea_profesor` ON `materias_enero_abril`(`profesor_id`);
CREATE INDEX IF NOT EXISTS `idx_materias_ma_profesor` ON `materias_mayo_agosto`(`profesor_id`);
CREATE INDEX IF NOT EXISTS `idx_materias_sd_profesor` ON `materias_septiembre_diciembre`(`profesor_id`);

CREATE INDEX IF NOT EXISTS `idx_grupos_ea_materia` ON `grupos_enero_abril`(`materia_id`);
CREATE INDEX IF NOT EXISTS `idx_grupos_ma_materia` ON `grupos_mayo_agosto`(`materia_id`);
CREATE INDEX IF NOT EXISTS `idx_grupos_sd_materia` ON `grupos_septiembre_diciembre`(`materia_id`);

CREATE INDEX IF NOT EXISTS `idx_asignaciones_ea_grupo` ON `asignaciones_enero_abril`(`grupo_id`);
CREATE INDEX IF NOT EXISTS `idx_asignaciones_ma_grupo` ON `asignaciones_mayo_agosto`(`grupo_id`);
CREATE INDEX IF NOT EXISTS `idx_asignaciones_sd_grupo` ON `asignaciones_septiembre_diciembre`(`grupo_id`);
