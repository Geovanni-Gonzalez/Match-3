// server/src/api/index.ts
import { Router } from 'express';
import jugadorApi from './jugador.api';
import partidaApi from './partida.api';

const router = Router();

router.use('/jugador', jugadorApi);
router.use('/partida', partidaApi);

// Health check root
router.get('/', (_, res) => res.json({ message: 'API Match-3 OK' }));

export default router;
