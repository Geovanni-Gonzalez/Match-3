/**
 * @file partida.api.ts
 * @description Definición de endpoints REST relacionados con la entidad Partida.
 *
 * Maneja la creación de partidas, listado, unión de jugadores y consulta de rankings.
 * Utiliza inyección de dependencias para acceder a GameService.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PartidaRepo } from '../core/repositories/PartidaRepo.js';
import { v4 as uuidv4 } from 'uuid';
import { GameService } from '../core/services/GameService.js';
import { validateBody } from '../utils/validate.middleware.js';
import { crearPartidaSchema, agregarJugadorSchema } from '../utils/validation.schemas.js';
import Logger from '../utils/Logger.js';
import { GameConfig } from '@match3/shared';

const router = Router();
let gameService: GameService;

/**
 * Inyecta la instancia de GameService necesaria para la lógica de negocio.
 * @param serviceInstance - Instancia singleton de GameService.
 */
export function setGameService(serviceInstance: GameService) {
  gameService = serviceInstance;
}

/**
 * Middleware para asegurar que GameService está inicializado.
 */
const ensureGameService = (req: Request, res: Response, next: NextFunction) => {
  if (!gameService) {
    return res.status(500).json({ message: 'GameService no inicializado en API' });
  }
  next();
};

/**
 * @route POST /api/partida/crear_partida
 * @description Crea una nueva partida en el sistema.
 */
router.post(
  '/crear_partida',
  ensureGameService,
  validateBody(crearPartidaSchema),
  async (req: Request, res: Response) => {
    const { tipoJuego, tematica, numJugadoresMax, duracion } = req.body as GameConfig;

    if (!tipoJuego || !tematica || !numJugadoresMax) {
      return res.status(400).json({ message: 'Datos de partida inválidos.' });
    }

    try {
      const codigoPartida = uuidv4().split('-')[0].toUpperCase();
      await gameService.crearPartida(codigoPartida, tipoJuego, tematica, numJugadoresMax, duracion);

      Logger.info('[API][Partida] Partida creada', {
        codigoPartida,
        tipoJuego,
        tematica,
        numJugadoresMax,
      });
      return res.status(201).json({
        message: 'Partida creada exitosamente',
        codigoPartida,
        tipoJuego,
        tematica,
        numJugadoresMax,
      });
    } catch (err) {
      console.error('[API][Partida] Error crear_partida:', err);
      return res.status(500).json({ message: 'Error interno al crear partida.' });
    }
  }
);

/**
 * @route POST /api/partida/agregar_jugador
 */
router.post('/agregar_jugador', validateBody(agregarJugadorSchema), async (req: Request, res: Response) => {
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
 * @route GET /api/partida/partidas
 */
router.get('/partidas', ensureGameService, async (req: Request, res: Response) => {
  try {
    const partidas = gameService.listarPartidasDisponibles();
    return res.status(200).json(partidas);
  } catch (err) {
    console.error('[API][Partida] Error obtener partidas:', err);
    return res.status(500).json({ message: 'Error interno al obtener partidas.' });
  }
});

/**
 * @route GET /api/partida/ranking
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
