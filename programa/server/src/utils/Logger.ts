/**
 * @file Logger.ts
 * @description Configuración del sistema de logging de la aplicación.
 * 
 * Utiliza la librería 'winston' para gestionar logs estructurados.
 * Configurado para salida por consola con colores y formato simple en desarrollo.
 */

import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

export default logger;
