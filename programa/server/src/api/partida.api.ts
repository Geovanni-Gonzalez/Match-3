// server/src/api/partida.api.ts
import { Router, Request, Response } from 'express';
import { PartidaRepo } from '../core/repositories/PartidaRepo.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/partida/crear_partida
 * Body: { tipoJuego, tematica, numJugadoresMax }
 * Respuesta: { partidaId, tipoJuego, tematica, numJugadoresMax }
 */
router.post('/crear_partida', async (req: Request, res: Response) => {
  const { tipoJuego, tematica, numJugadoresMax } = req.body;
  if (!tipoJuego || !tematica || !numJugadoresMax) {
    return res.status(400).json({ message: 'Datos de partida inválidos.' });
  }
  try {
    // Generar código de partida único (6 caracteres alfanuméricos)
    const codigoPartida = uuidv4().split('-')[0].toUpperCase(); // Usar los primeros 6 caracteres del UUID
    const partidaId = await PartidaRepo.crearPartida(codigoPartida, tipoJuego, tematica, numJugadoresMax);
    console.log('[API][Partida] Partida creada con ID:', partidaId);
    return res.status(201).json({ message: 'Partida creada exitosamente', codigoPartida, tipoJuego, tematica, numJugadoresMax });
  } catch (err) {
    console.error('[API][Partida] Error crear_partida:', err);
    return res.status(500).json({ message: 'Error interno al crear partida.' });
  }
});

export default router;