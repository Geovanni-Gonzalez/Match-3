/**
 * @file index.ts
 * @description Punto de entrada principal del servidor.
 * @author Geovanni Gonzalez
 * @date 2025
 * 
 * Este archivo se encarga de:
 * 1. Importar la configuración del servidor.
 * 2. Inicializar la conexión a la base de datos.
 * 3. Poner en marcha el servidor HTTP en el puerto especificado.
 */

import { server } from './server.js';
import Logger from './utils/Logger.js';
import { initDb } from './scripts/initDb.js';

const PORT = process.env.PORT || 4000;

/**
 * Inicializa la base de datos y arranca el servidor.
 * Si la base de datos falla, el proceso termina con error (exit code 1).
 */
initDb().then(() => {
    server.listen(PORT, () => Logger.info(`[Server] corriendo en http://localhost:${PORT}`));
}).catch(err => {
    console.error('Error fatal al iniciar servidor (DB):', err);
    if (err && typeof err === 'object') {
        try {
            console.error(JSON.stringify(err, null, 2));
        } catch (e) {
            console.error('Error stringifying error object');
        }
    }
    process.exit(1);
});
