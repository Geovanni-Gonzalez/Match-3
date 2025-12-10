/**
 * @file jugador.api.ts
 * @description Definición de endpoints REST relacionados con la entidad Jugador.
 */

import { Router, Request, Response } from 'express';
import { PlayerRepo } from '../core/repositories/PlayerRepo.js';
import { validateBody } from '../utils/validate.middleware.js';
import { registrarJugadorSchema } from '../utils/validation.schemas.js';

const router = Router();

/**
 * @route POST /api/jugador/registrar
 * @description Registra un nuevo jugador o recupera uno existente por su nickname.
 *
 * @body {string} nickname - Nombre de usuario deseado.
 * @returns {object} 200 - { message, jugadorId, nickname }
 * @returns {object} 400 - Error de validación.
 * @returns {object} 500 - Error interno del servidor.
 */
router.post('/registrar', validateBody(registrarJugadorSchema), async (req: Request, res: Response) => {
  const { nickname } = req.body;

  try {
    const jugadorId = await PlayerRepo.findOrCreateByNickname(nickname);
    return res.status(200).json({ message: 'Registro exitoso', jugadorId: jugadorId, nickname: nickname });
  } catch (err) {
    console.error('[API][jugador] Error registrar:', err);
    return res.status(500).json({ message: 'Error interno al registrar jugador.' });
  }
});

export default router;
