DROP TABLE IF EXISTS gastos;
DROP TABLE IF EXISTS eventos;
DROP TABLE IF EXISTS ingresos;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255),
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    google_sub VARCHAR(255) UNIQUE,
    last_activity TIMESTAMP,
    last_login TIMESTAMP,
    session_version INTEGER NOT NULL DEFAULT 0,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    genero VARCHAR(30) CHECK (genero IS NULL OR UPPER(TRIM(genero)) IN ('FEMENINO', 'MASCULINO')),
    foto_url TEXT,
    moneda VARCHAR(3) NOT NULL DEFAULT 'GTQ',
    tema VARCHAR(10) NOT NULL DEFAULT 'CLARO',
    rol VARCHAR(50) DEFAULT 'USUARIO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ingresos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    lugar VARCHAR(255) NOT NULL,
    original VARCHAR(50) NOT NULL,
    conversion VARCHAR(50) NOT NULL
);

CREATE TABLE gastos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    lugar VARCHAR(255),
    categoria VARCHAR(80) NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'VARIABLE' CHECK (tipo IN ('FIJO', 'VARIABLE')),
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    moneda VARCHAR(3) NOT NULL DEFAULT 'GTQ' CHECK (moneda IN ('GTQ', 'USD')),
    total_deuda NUMERIC(12, 2) CHECK (total_deuda IS NULL OR total_deuda >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(80) NOT NULL,
    invitados INTEGER CHECK (invitados IS NULL OR invitados >= 0),
    lugar VARCHAR(255),
    fecha DATE NOT NULL,
    presupuesto NUMERIC(12, 2) NOT NULL CHECK (presupuesto >= 0),
    estado VARCHAR(30) NOT NULL DEFAULT 'PLANIFICADO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX gastos_deuda_lookup_idx
    ON gastos (usuario_id, categoria, (LOWER(TRIM(descripcion))))
    WHERE LOWER(TRIM(categoria)) = 'deuda';

CREATE UNIQUE INDEX idx_usuarios_google_sub
    ON usuarios (google_sub)
    WHERE google_sub IS NOT NULL;

-- Credenciales del administrador: usuario admin, contraseña admin123.
-- El correo usado por este script es manu@gmail.com.
INSERT INTO usuarios (usuario, correo, password, nombre, apellido, genero, moneda, tema, rol)
VALUES
('admin', 'manu@gmail.com', '$2b$10$ORZGZJi7qiND8bGK9nOyGeJJO.3ypBWV59tXzBmmDNPFtv5.6wEQe', 'Cristian', 'Montepeque', 'MASCULINO', 'USD', 'OSCURO', 'ADMIN');

-- Consultas para visualizar todas las tablas de la base de datos.
SELECT * FROM usuarios;
SELECT * FROM ingresos;
SELECT * FROM gastos;
SELECT * FROM eventos;