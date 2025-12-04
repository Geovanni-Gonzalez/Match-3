// server/src/api/partida.api.ts
import { Router, Request, Response } from 'express';
import { PartidaRepo } from '../core/repositories/PartidaRepo.js';
import { v4 as uuidv4 } from 'uuid';
import { GameService } from '../core/services/GameService.js';

const router = Router();
let gameService: GameService; // Variable para mantener la instancia de GameService

// Función para inyectar GameService
export function setGameService(serviceInstance: GameService) {
  gameService = serviceInstance;
}

/**
 * POST /api/partida/crear_partida
 * Body: { tipoJuego, tematica, numJugadoresMax }
 * Respuesta: { partidaId, tipoJuego, tematica, numJugadoresMax }
 */
router.post('/crear_partida', async (req: Request, res: Response) => {
  const { tipoJuego, tematica, numJugadoresMax, duracion } = req.body;
  if (!tipoJuego || !tematica || !numJugadoresMax) {
    return res.status(400).json({ message: 'Datos de partida inválidos.' });
  }
  try {
    // Generar código de partida único (6 caracteres alfanuméricos)
    const codigoPartida = uuidv4().split('-')[0].toUpperCase(); // Usar los primeros 6 caracteres del UUID

    // Usar GameService para crear en memoria Y persistir en BD
    if (!gameService) {
      throw new Error('GameService no inicializado en API');
    }
    await gameService.crearPartida(codigoPartida, tipoJuego, tematica, numJugadoresMax, duracion);

    console.log('[API][Partida] Partida creada con ID:', codigoPartida);
    return res.status(201).json({ message: 'Partida creada exitosamente', codigoPartida, tipoJuego, tematica, numJugadoresMax });
  } catch (err) {
    console.error('[API][Partida] Error crear_partida:', err);
    return res.status(500).json({ message: 'Error interno al crear partida.' });
  }
});

/**
 * POST /api/partida/agregar_jugador
 * Body: { codigoPartida, jugadorId }
 * Respuesta: { message }
 */
router.post('/agregar_jugador', async (req: Request, res: Response) => {
  const { codigoPartida, jugadorId } = req.body;
  if (!codigoPartida || !jugadorId) {
    return res.status(400).json({ message: 'Datos inválidos para agregar jugador a partida.' });
  }
  try {
    await PartidaRepo.agregarJugadorAPartida(codigoPartida, jugadorId);
    return res.status(200).json({ message: 'Jugador agregado a la partida exitosamente' });
  } catch (err) {
    console.error('[API][Partida] Error agregar_jugador:', err);
    return res.status(500).json({ message: 'Error interno al agregar jugador a la partida.' });
  }
});

/**
 * GET /api/partida/partidas
 * Respuesta: Array de partidas disponibles
 */
router.get('/partidas', async (req: Request, res: Response) => {
  try {
    if (!gameService) {
      return res.status(500).json({ message: 'GameService no disponible' });
    }
    const partidas = gameService.listarPartidasDisponibles();
    return res.status(200).json(partidas);
  } catch (err) {
    console.error('[API][Partida] Error obtener partidas:', err);
    return res.status(500).json({ message: 'Error interno al obtener partidas.' });
  }
});

/**
 * GET /api/partida/ranking
 * Respuesta: { ranking: [...] }
 */
router.get('/ranking', async (req: Request, res: Response) => {
  try {
    const ranking = await PartidaRepo.obtenerRankingHistorico();
    return res.status(200).json({ ranking });
  } catch (err) {
    console.error('[API][Partida] Error obtener ranking:', err);
    return res.status(500).json({ message: 'Error interno al obtener ranking.' });
  }
});


export default router;