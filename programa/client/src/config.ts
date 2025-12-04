/**
 * @file config.ts
 * @description Archivo de configuración del cliente.
 * 
 * Exporta la URL del backend obtenida de variables de entorno.
 * Usa `http://localhost:4000` como valor por defecto si no está configurada.
 */

export const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
