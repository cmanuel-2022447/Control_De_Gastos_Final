"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.databaseConfig = void 0;
exports.testDatabaseConnection = testDatabaseConnection;
exports.initializeDatabase = initializeDatabase;
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
exports.databaseConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
};
exports.pool = new pg_1.Pool(exports.databaseConfig);
function testDatabaseConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield exports.pool.connect();
        try {
            yield client.query('SELECT NOW()');
        }
        finally {
            client.release();
        }
    });
}
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
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
            genero VARCHAR(30),
            foto_url TEXT,
            moneda VARCHAR(3) NOT NULL DEFAULT 'GTQ',
            tema VARCHAR(10) NOT NULL DEFAULT 'CLARO',
            rol VARCHAR(50) DEFAULT 'USUARIO',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ingresos (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
            fecha DATE NOT NULL,
            descripcion VARCHAR(255) NOT NULL,
            lugar VARCHAR(255) NOT NULL,
            original VARCHAR(50) NOT NULL,
            conversion VARCHAR(50) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS gastos (
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

        CREATE TABLE IF NOT EXISTS eventos (
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

    `);
        yield exports.pool.query(`
        DROP TABLE IF EXISTS public.gastos_eventos;

        ALTER TABLE IF EXISTS public.gastos
        ADD COLUMN IF NOT EXISTS total_deuda NUMERIC(12, 2),
        ADD COLUMN IF NOT EXISTS lugar VARCHAR(255),
        DROP COLUMN IF EXISTS pago_deuda;

        ALTER TABLE IF EXISTS public.gastos
        DROP CONSTRAINT IF EXISTS gastos_tipo_check,
        DROP CONSTRAINT IF EXISTS gastos_total_deuda_check,
        DROP CONSTRAINT IF EXISTS gastos_pago_deuda_check;

        DROP TABLE IF EXISTS public.ahorros;
        DROP TABLE IF EXISTS public.deudas;
    `);
        yield exports.pool.query(`
        UPDATE public.gastos
        SET tipo = 'VARIABLE'
        WHERE tipo = 'DEUDA';
    `);
        yield exports.pool.query(`
        ALTER TABLE IF EXISTS public.gastos
        ADD CONSTRAINT gastos_tipo_check CHECK (tipo IN ('FIJO', 'VARIABLE')),
        ADD CONSTRAINT gastos_total_deuda_check CHECK (total_deuda IS NULL OR total_deuda >= 0);
    `);
        yield exports.pool.query(`
        ALTER TABLE IF EXISTS public.eventos
        ADD COLUMN IF NOT EXISTS invitados INTEGER,
        ADD COLUMN IF NOT EXISTS lugar VARCHAR(255);

        ALTER TABLE IF EXISTS public.eventos
        DROP CONSTRAINT IF EXISTS eventos_invitados_check;

        ALTER TABLE IF EXISTS public.eventos
        ADD CONSTRAINT eventos_invitados_check CHECK (invitados IS NULL OR invitados >= 0);
    `);
        yield exports.pool.query(`
        ALTER TABLE IF EXISTS public.usuarios
        ADD COLUMN IF NOT EXISTS nombre VARCHAR(100),
        ADD COLUMN IF NOT EXISTS apellido VARCHAR(100),
        ADD COLUMN IF NOT EXISTS genero VARCHAR(30),
        ADD COLUMN IF NOT EXISTS foto_url TEXT,
        ADD COLUMN IF NOT EXISTS moneda VARCHAR(3) NOT NULL DEFAULT 'GTQ',
        ADD COLUMN IF NOT EXISTS tema VARCHAR(10) NOT NULL DEFAULT 'CLARO';

        UPDATE public.usuarios
        SET genero = NULL
        WHERE genero IS NOT NULL AND UPPER(TRIM(genero)) NOT IN ('FEMENINO', 'MASCULINO');

        ALTER TABLE IF EXISTS public.usuarios
        DROP CONSTRAINT IF EXISTS usuarios_genero_check;

        ALTER TABLE IF EXISTS public.usuarios
        ADD CONSTRAINT usuarios_genero_check
        CHECK (genero IS NULL OR UPPER(TRIM(genero)) IN ('FEMENINO', 'MASCULINO'));

        ALTER TABLE IF EXISTS public.usuarios
        ALTER COLUMN password DROP NOT NULL,
        ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
        ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255),
        ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP,
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
        ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_google_sub
        ON public.usuarios (google_sub)
        WHERE google_sub IS NOT NULL;
    `);
        yield exports.pool.query(`
        ALTER TABLE IF EXISTS public.ingresos
        ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES public.usuarios(id) ON DELETE CASCADE;
    `);
        yield exports.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_usuarios_correo_lower
        ON public.usuarios ((LOWER(correo)));
    `);
        yield exports.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_usuarios_usuario_lower
        ON public.usuarios ((LOWER(usuario)));
    `);
        yield exports.pool.query(`
        ALTER TABLE IF EXISTS public.ingresos
        DROP COLUMN IF EXISTS created_at;
    `);
    });
}
