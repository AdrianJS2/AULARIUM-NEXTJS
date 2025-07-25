-- Adminer 5.3.0 MySQL 8.0.42 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `asignaciones_enero_abril`;
CREATE TABLE `asignaciones_enero_abril` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grupo_id` int DEFAULT NULL,
  `aula_id` int DEFAULT NULL,
  `materia_id` int DEFAULT NULL,
  `carrera_id` int DEFAULT NULL,
  `dia` text NOT NULL,
  `hora_inicio` text NOT NULL,
  `hora_fin` text NOT NULL,
  `turno` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `grupo_id` (`grupo_id`),
  KEY `aula_id` (`aula_id`),
  KEY `materia_id` (`materia_id`),
  KEY `carrera_id` (`carrera_id`),
  CONSTRAINT `asignaciones_enero_abril_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos_enero_abril` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asignaciones_enero_abril_ibfk_2` FOREIGN KEY (`aula_id`) REFERENCES `aulas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `asignaciones_enero_abril_ibfk_3` FOREIGN KEY (`materia_id`) REFERENCES `materias_enero_abril` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asignaciones_enero_abril_ibfk_4` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `asignaciones_enero_abril` (`id`, `grupo_id`, `aula_id`, `materia_id`, `carrera_id`, `dia`, `hora_inicio`, `hora_fin`, `turno`, `created_at`) VALUES
(35,	8,	1,	13,	NULL,	'Lunes',	'08:00',	'09:00',	'MAÑANA',	'2025-07-20 18:41:52'),
(36,	8,	1,	13,	NULL,	'Martes',	'08:00',	'09:00',	'MAÑANA',	'2025-07-20 18:41:52');

DROP TABLE IF EXISTS `asignaciones_mayo_agosto`;
CREATE TABLE `asignaciones_mayo_agosto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grupo_id` int DEFAULT NULL,
  `aula_id` int DEFAULT NULL,
  `materia_id` int DEFAULT NULL,
  `carrera_id` int DEFAULT NULL,
  `dia` text NOT NULL,
  `hora_inicio` text NOT NULL,
  `hora_fin` text NOT NULL,
  `turno` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `grupo_id` (`grupo_id`),
  KEY `aula_id` (`aula_id`),
  KEY `materia_id` (`materia_id`),
  KEY `carrera_id` (`carrera_id`),
  CONSTRAINT `asignaciones_mayo_agosto_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos_mayo_agosto` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asignaciones_mayo_agosto_ibfk_2` FOREIGN KEY (`aula_id`) REFERENCES `aulas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `asignaciones_mayo_agosto_ibfk_3` FOREIGN KEY (`materia_id`) REFERENCES `materias_mayo_agosto` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asignaciones_mayo_agosto_ibfk_4` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `asignaciones_mayo_agosto` (`id`, `grupo_id`, `aula_id`, `materia_id`, `carrera_id`, `dia`, `hora_inicio`, `hora_fin`, `turno`, `created_at`) VALUES
(7,	4,	1,	1,	NULL,	'Miércoles',	'08:00',	'10:00',	'MAÑANA',	'2025-07-20 18:42:15'),
(8,	4,	1,	1,	NULL,	'Lunes',	'12:00',	'13:00',	'MAÑANA',	'2025-07-20 18:42:15'),
(9,	4,	1,	1,	NULL,	'Lunes',	'13:00',	'14:00',	'MAÑANA',	'2025-07-20 18:42:15');

DROP TABLE IF EXISTS `asignaciones_septiembre_diciembre`;
CREATE TABLE `asignaciones_septiembre_diciembre` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grupo_id` int DEFAULT NULL,
  `aula_id` int DEFAULT NULL,
  `materia_id` int DEFAULT NULL,
  `carrera_id` int DEFAULT NULL,
  `dia` text NOT NULL,
  `hora_inicio` text NOT NULL,
  `hora_fin` text NOT NULL,
  `turno` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `grupo_id` (`grupo_id`),
  KEY `aula_id` (`aula_id`),
  KEY `materia_id` (`materia_id`),
  KEY `carrera_id` (`carrera_id`),
  CONSTRAINT `asignaciones_septiembre_diciembre_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos_septiembre_diciembre` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asignaciones_septiembre_diciembre_ibfk_2` FOREIGN KEY (`aula_id`) REFERENCES `aulas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `asignaciones_septiembre_diciembre_ibfk_3` FOREIGN KEY (`materia_id`) REFERENCES `materias_septiembre_diciembre` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asignaciones_septiembre_diciembre_ibfk_4` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `asignaciones_septiembre_diciembre` (`id`, `grupo_id`, `aula_id`, `materia_id`, `carrera_id`, `dia`, `hora_inicio`, `hora_fin`, `turno`, `created_at`) VALUES
(10,	2,	1,	2,	NULL,	'Lunes',	'15:00',	'16:00',	'TARDE',	'2025-07-20 18:42:24'),
(11,	2,	1,	2,	NULL,	'Martes',	'16:00',	'17:00',	'TARDE',	'2025-07-20 18:42:24'),
(12,	2,	1,	2,	NULL,	'Jueves',	'17:00',	'19:00',	'TARDE',	'2025-07-20 18:42:24');

DROP TABLE IF EXISTS `aulas`;
CREATE TABLE `aulas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `capacidad` int NOT NULL,
  `equipamiento` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `aulas` (`id`, `nombre`, `capacidad`, `equipamiento`, `created_at`) VALUES
(1,	'Aulita Magna',	20,	'Proye',	'2025-07-16 03:44:18');

DROP TABLE IF EXISTS `carreras`;
CREATE TABLE `carreras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `carreras` (`id`, `nombre`) VALUES
(1,	'Ingeniería en Sistemas');

DROP TABLE IF EXISTS `grupos_enero_abril`;
CREATE TABLE `grupos_enero_abril` (
  `id` int NOT NULL AUTO_INCREMENT,
  `materia_id` int DEFAULT NULL,
  `numero` text NOT NULL,
  `alumnos` int NOT NULL,
  `turno` text NOT NULL,
  `horarios` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `materia_id` (`materia_id`),
  CONSTRAINT `grupos_enero_abril_ibfk_1` FOREIGN KEY (`materia_id`) REFERENCES `materias_enero_abril` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `grupos_enero_abril` (`id`, `materia_id`, `numero`, `alumnos`, `turno`, `horarios`, `created_at`) VALUES
(8,	13,	'20A',	12,	'MAÑANA',	'[{\"dia\": \"Lunes\", \"hora_fin\": \"09:00\", \"hora_inicio\": \"08:00\"}, {\"dia\": \"Martes\", \"hora_fin\": \"09:00\", \"hora_inicio\": \"08:00\"}]',	'2025-07-20 03:49:09');

DROP TABLE IF EXISTS `grupos_mayo_agosto`;
CREATE TABLE `grupos_mayo_agosto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `materia_id` int DEFAULT NULL,
  `numero` text NOT NULL,
  `alumnos` int NOT NULL,
  `turno` text NOT NULL,
  `horarios` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `materia_id` (`materia_id`),
  CONSTRAINT `grupos_mayo_agosto_ibfk_1` FOREIGN KEY (`materia_id`) REFERENCES `materias_mayo_agosto` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `grupos_mayo_agosto` (`id`, `materia_id`, `numero`, `alumnos`, `turno`, `horarios`, `created_at`) VALUES
(4,	1,	'29A',	12,	'MAÑANA',	'[{\"dia\": \"Miércoles\", \"hora_fin\": \"10:00\", \"hora_inicio\": \"08:00\"}, {\"dia\": \"Lunes\", \"hora_fin\": \"13:00\", \"hora_inicio\": \"12:00\"}, {\"dia\": \"Lunes\", \"hora_fin\": \"14:00\", \"hora_inicio\": \"13:00\"}]',	'2025-07-18 03:29:16');

DROP TABLE IF EXISTS `grupos_septiembre_diciembre`;
CREATE TABLE `grupos_septiembre_diciembre` (
  `id` int NOT NULL AUTO_INCREMENT,
  `materia_id` int DEFAULT NULL,
  `numero` text NOT NULL,
  `alumnos` int NOT NULL,
  `turno` text NOT NULL,
  `horarios` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `materia_id` (`materia_id`),
  CONSTRAINT `grupos_septiembre_diciembre_ibfk_1` FOREIGN KEY (`materia_id`) REFERENCES `materias_septiembre_diciembre` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `grupos_septiembre_diciembre` (`id`, `materia_id`, `numero`, `alumnos`, `turno`, `horarios`, `created_at`) VALUES
(2,	2,	'22A',	18,	'TARDE',	'[{\"dia\": \"Lunes\", \"hora_fin\": \"16:00\", \"hora_inicio\": \"15:00\"}, {\"dia\": \"Martes\", \"hora_fin\": \"17:00\", \"hora_inicio\": \"16:00\"}, {\"dia\": \"Jueves\", \"hora_fin\": \"19:00\", \"hora_inicio\": \"17:00\"}]',	'2025-07-19 02:16:11');

DROP TABLE IF EXISTS `materias_enero_abril`;
CREATE TABLE `materias_enero_abril` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` text NOT NULL,
  `profesor_id` int DEFAULT NULL,
  `carrera_id` int DEFAULT NULL,
  `usuario_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `profesor_id` (`profesor_id`),
  KEY `carrera_id` (`carrera_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `materias_enero_abril_ibfk_1` FOREIGN KEY (`profesor_id`) REFERENCES `profesores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `materias_enero_abril_ibfk_2` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE SET NULL,
  CONSTRAINT `materias_enero_abril_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `materias_enero_abril` (`id`, `nombre`, `profesor_id`, `carrera_id`, `usuario_id`, `created_at`) VALUES
(13,	'MatesAplicadasss',	7,	NULL,	'365246cb-4209-4503-a33c-95ada2414df5',	'2025-07-18 13:10:44'),
(14,	'Ingles',	8,	NULL,	NULL,	'2025-07-20 01:42:49'),
(16,	'MatesAplicadas',	8,	1,	'365246cb-4209-4503-a33c-95ada2414df5',	'2025-07-20 04:44:59'),
(17,	'Matologia',	8,	1,	'365246cb-4209-4503-a33c-95ada2414df5',	'2025-07-20 05:03:14');

DROP TABLE IF EXISTS `materias_mayo_agosto`;
CREATE TABLE `materias_mayo_agosto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` text NOT NULL,
  `profesor_id` int DEFAULT NULL,
  `carrera_id` int DEFAULT NULL,
  `usuario_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `profesor_id` (`profesor_id`),
  KEY `carrera_id` (`carrera_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `materias_mayo_agosto_ibfk_1` FOREIGN KEY (`profesor_id`) REFERENCES `profesores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `materias_mayo_agosto_ibfk_2` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE SET NULL,
  CONSTRAINT `materias_mayo_agosto_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `materias_mayo_agosto` (`id`, `nombre`, `profesor_id`, `carrera_id`, `usuario_id`, `created_at`) VALUES
(1,	'Añalogia',	8,	NULL,	'365246cb-4209-4503-a33c-95ada2414df5',	'2025-07-18 02:35:04');

DROP TABLE IF EXISTS `materias_septiembre_diciembre`;
CREATE TABLE `materias_septiembre_diciembre` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` text NOT NULL,
  `profesor_id` int DEFAULT NULL,
  `carrera_id` int DEFAULT NULL,
  `usuario_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `profesor_id` (`profesor_id`),
  KEY `carrera_id` (`carrera_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `materias_septiembre_diciembre_ibfk_1` FOREIGN KEY (`profesor_id`) REFERENCES `profesores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `materias_septiembre_diciembre_ibfk_2` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE SET NULL,
  CONSTRAINT `materias_septiembre_diciembre_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `materias_septiembre_diciembre` (`id`, `nombre`, `profesor_id`, `carrera_id`, `usuario_id`, `created_at`) VALUES
(2,	'Historia',	8,	NULL,	'365246cb-4209-4503-a33c-95ada2414df5',	'2025-07-19 02:15:29');

DROP TABLE IF EXISTS `notificaciones`;
CREATE TABLE `notificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(50) NOT NULL,
  `mensaje` text NOT NULL,
  `datos` json DEFAULT NULL,
  `leida` tinyint(1) DEFAULT '0',
  `resuelta` tinyint(1) DEFAULT '0',
  `destinatario_id` varchar(36) NOT NULL,
  `remitente_id` varchar(36) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `destinatario_id` (`destinatario_id`),
  KEY `remitente_id` (`remitente_id`),
  CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`destinatario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notificaciones_ibfk_2` FOREIGN KEY (`remitente_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `periodos`;
CREATE TABLE `periodos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `periodos` (`id`, `nombre`, `fecha_inicio`, `fecha_fin`) VALUES
(1,	'Enero-Abril',	'2025-01-01',	'2025-04-30'),
(2,	'Mayo-Agosto',	'2025-05-01',	'2025-08-31'),
(3,	'Septiembre-Diciembre',	'2025-09-01',	'2025-12-31');

DROP TABLE IF EXISTS `profesor_usuario`;
CREATE TABLE `profesor_usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `profesor_id` int NOT NULL,
  `usuario_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profesor_id` (`profesor_id`,`usuario_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `profesor_usuario_ibfk_1` FOREIGN KEY (`profesor_id`) REFERENCES `profesores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `profesor_usuario_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `profesores`;
CREATE TABLE `profesores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `disponibilidad` json DEFAULT NULL COMMENT 'Almacena la disponibilidad del profesor por día y hora',
  `usuario_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `usuario_id` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `profesores` (`id`, `nombre`, `email`, `disponibilidad`, `usuario_id`, `created_at`) VALUES
(4,	'Adrian RodriguezzZ',	'rodriguezgomezadrian98@gmail.com',	NULL,	NULL,	'2025-07-17 01:44:50'),
(7,	'Adrian Rodriguezz',	'rodriguezgomezadrian2@gmail.com',	'{\"Lunes\": {\"07:00\": false, \"08:00\": true, \"09:00\": false, \"10:00\": false, \"11:00\": false, \"12:00\": false, \"13:00\": false, \"14:00\": false, \"15:00\": false, \"16:00\": false, \"17:00\": false, \"18:00\": false, \"19:00\": false, \"20:00\": false, \"21:00\": false}, \"Jueves\": {\"07:00\": false, \"08:00\": true, \"09:00\": false, \"10:00\": false, \"11:00\": false, \"12:00\": false, \"13:00\": false, \"14:00\": false, \"15:00\": false, \"16:00\": false, \"17:00\": false, \"18:00\": false, \"19:00\": false, \"20:00\": false, \"21:00\": false}, \"Martes\": {\"07:00\": false, \"08:00\": true, \"09:00\": false, \"10:00\": false, \"11:00\": false, \"12:00\": false, \"13:00\": false, \"14:00\": false, \"15:00\": false, \"16:00\": false, \"17:00\": false, \"18:00\": false, \"19:00\": false, \"20:00\": false, \"21:00\": false}, \"Viernes\": {\"07:00\": false, \"08:00\": true, \"09:00\": false, \"10:00\": false, \"11:00\": false, \"12:00\": false, \"13:00\": false, \"14:00\": false, \"15:00\": false, \"16:00\": false, \"17:00\": false, \"18:00\": false, \"19:00\": false, \"20:00\": false, \"21:00\": false}, \"Miércoles\": {\"07:00\": false, \"08:00\": true, \"09:00\": false, \"10:00\": false, \"11:00\": false, \"12:00\": false, \"13:00\": false, \"14:00\": false, \"15:00\": false, \"16:00\": false, \"17:00\": false, \"18:00\": false, \"19:00\": false, \"20:00\": false, \"21:00\": false}}',	NULL,	'2025-07-17 01:45:23'),
(8,	'Ana H',	'rodriguezgomezadrian99@gmail.com',	NULL,	NULL,	'2025-07-18 03:28:07'),
(9,	'Estadistica',	'rodriguezgomezadrian98@ejemplo.com',	NULL,	NULL,	'2025-07-20 18:43:17');

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` varchar(36) NOT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `rol` varchar(50) NOT NULL DEFAULT 'usuario',
  `carrera_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `auth_uuid` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL COMMENT 'Contraseña hasheada del usuario',
  `email_verificado` tinyint(1) NOT NULL DEFAULT '0',
  `token_verificacion` varchar(255) DEFAULT NULL,
  `token_expiracion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `auth_uuid` (`auth_uuid`),
  KEY `carrera_id` (`carrera_id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `rol`, `carrera_id`, `created_at`, `auth_uuid`, `password`, `email_verificado`, `token_verificacion`, `token_expiracion`) VALUES
('019e6203-8459-45bb-ba49-91d88c018f7f',	'Adrian RodriguezzZ',	'rodriguezgomezadrian99@gmail.com',	'usuario',	NULL,	'2025-07-20 21:10:42',	NULL,	'$2b$10$0qzFsZJChBkG8o..PMlc6.gm4GSNIFIKUw0x6MTIAnv6yUjKF9.o2',	1,	'ffb25d8f6ae2eb2624481c2da0a4f145969ead1e7996ccbf88e092d92a3685a0',	'2025-07-21 16:10:43'),
('365246cb-4209-4503-a33c-95ada2414df5',	'Adrian',	'rodriguezgomezadrian98@gmail.com',	'admin',	1,	'2025-07-18 02:00:43',	NULL,	'$2b$10$//PekEB739lej5rZ0aPUZeNZxxHeNi57pBpMxJ/CstPg23ssf43Ve',	1,	NULL,	NULL),
('6e4e0717-72e4-496a-90a4-c4244645217a',	'PruebaFinal',	'manuel.estrada2305zzz@gmail.com',	'usuario',	NULL,	'2025-07-20 21:42:49',	NULL,	'$2b$10$clFV91q52oMb.YzalG.13uiV8FeD/m1mNvjTPFbe/PFNF5zX/YGWO',	0,	'ea315496ee2f160c5ff0410172303968315d13449bd726e3b5b791ebd4a1f786',	'2025-07-21 16:42:50'),
('cba46568-a84b-43cf-beac-56632575e07b',	'PruebaFinal',	'rodriguezgomezadrian98+test1@gmail.com',	'usuario',	NULL,	'2025-07-20 21:51:02',	NULL,	'$2b$10$VyXee1dldwcPlpHMcUkFNODzn8ovn4.9yBizqs0k9g3EFmZ9VhNfe',	1,	'4146c43688a73467bef9e20e023b5aadfb5e5ecd4afc693fa7630566049952a7',	'2025-07-21 16:51:03');

-- 2025-07-23 02:15:15 UTC
