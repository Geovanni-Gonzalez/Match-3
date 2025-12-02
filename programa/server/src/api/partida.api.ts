// server/src/api/jugador.api.ts
import { Router, Request, Response } from 'express';
import { PlayerRepo } from '../core/repositories/PlayerRepo.js';

const router = Router();

/**
 * POST /api/jugador/registrar
 * Body: { nickname: string }
 * Respuesta: { jugadorId, nickname }
 */
router.post('/registrar', async (req: Request, res: Response) => {
  const { nickname } = req.body;
  if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 1) {
    return res.status(400).json({ message: 'Nickname inválido.' });
  }

  try {
    const jugadorId = await PlayerRepo.findOrCreateByNickname(nickname.trim());
    return res.status(200).json({ message: 'Registro exitoso', jugadorId, nickname: nickname.trim() });
  } catch (err) {
    console.error('[API][jugador] Error registrar:', err);
    return res.status(500).json({ message: 'Error interno al registrar jugador.' });
  }
});

export default router;
