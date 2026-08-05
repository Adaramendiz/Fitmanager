CREATE DATABASE IF NOT EXISTS fitmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fitmanager;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo_documento VARCHAR(50) NOT NULL,
  documento VARCHAR(50) NOT NULL UNIQUE,
  correo VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'Administrador',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  vence_en DATETIME NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reset_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS miembros (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  numero_documento VARCHAR(50) NOT NULL UNIQUE,
  tipo_documento VARCHAR(50),
  documento VARCHAR(50) NOT NULL UNIQUE,
  telefono VARCHAR(30),
  correo VARCHAR(100),
  direccion VARCHAR(255),
  fecha_registro DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'Inactivo',
  fecha_vencimiento DATE,
  plan VARCHAR(50),
  membresia VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS pagos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  miembro_id INT UNSIGNED NOT NULL,
  cliente_nombre VARCHAR(100),
  cliente_documento VARCHAR(50),
  valor DECIMAL(10, 2) NOT NULL,
  fecha_pago DATE NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  plan VARCHAR(50),
  membresia VARCHAR(50) DEFAULT 'Mensual',
  estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
  CONSTRAINT fk_pagos_miembros FOREIGN KEY (miembro_id) REFERENCES miembros(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS asistencias_entrenadores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entrenador_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  CONSTRAINT fk_asistencia_entrenador FOREIGN KEY (entrenador_id) REFERENCES entrenadores(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS asistencias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  miembro_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  CONSTRAINT fk_asistencias_miembros FOREIGN KEY (miembro_id) REFERENCES miembros(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS entrenadores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  especialidad VARCHAR(100) NOT NULL,
  telefono VARCHAR(30),
  correo VARCHAR(100),
  observaciones TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'Disponible'
);
