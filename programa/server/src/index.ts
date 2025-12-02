// src/index.ts
import { server } from './server';
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`[Server] corriendo en http://localhost:${PORT}`));
