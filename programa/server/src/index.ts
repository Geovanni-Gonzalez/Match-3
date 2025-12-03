// src/index.ts
import { server } from './server.js';
import Logger from './utils/Logger.js';
import { initDb } from './scripts/initDb.js';

const PORT = process.env.PORT || 4000;

// Inicializar BD antes de arrancar
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
