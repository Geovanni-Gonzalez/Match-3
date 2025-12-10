/**
 * @file config.ts
 * @description Configuración centralizada del servidor.
 * Carga las variables de entorno y las combina con los valores por defecto.
 */
import defaults from './defaults.json' with { type: 'json' };
import dotenv from 'dotenv';

dotenv.config();

/**
 * Objeto de configuración global.
 * Prioriza las variables de entorno (.env); si no existen, usa valores por defecto.
 */
const config = {
  ...defaults,
  /** Host de la base de datos MySQL. */
  DB_HOST: process.env.DB_HOST || 'localhost',
  /** Usuario de la base de datos. */
  DB_USER: process.env.DB_USER || 'root',
  /** Contraseña de la base de datos. */
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  /** Nombre de la base de datos. */
  DB_DATABASE: process.env.DB_DATABASE || 'matchdb',
  /** Puerto donde escuchará el servidor Express. */
  PORT: process.env.PORT || 4000,
  /** Nivel de detalle de los logs (info, debug, error). */
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

export default config;
