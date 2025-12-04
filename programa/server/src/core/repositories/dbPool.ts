/**
 * @file dbPool.ts
 * @description Configuración y exportación del pool de conexiones a la base de datos MySQL.
 * 
 * Utiliza `mysql2/promise` para permitir el uso de async/await en las consultas.
 * Las credenciales se cargan desde variables de entorno.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'matchdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


export default pool;