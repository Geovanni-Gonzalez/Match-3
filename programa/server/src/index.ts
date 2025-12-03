// src/index.ts
import { server } from './server.js';
import Logger from './utils/Logger.js';
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => Logger.info(`[Server] corriendo en http://localhost:${PORT}`));
