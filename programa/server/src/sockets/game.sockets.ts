// src/sockets/game.socket.ts
import { Server, Socket } from 'socket.io';
import { GameService } from '../core/services/GameService.js';

export function registerGameSockets(io: Server, gameService: GameService) {
  io.on('connection', (socket: Socket) => {
    // set_ready: historial anterior usaba 'player_ready' -> normalizar
    socket.on('set_ready', (data) => {
      const { isReady, partidaId } = data;
      if (!partidaId) return;
      gameService.setReady(partidaId, socket.id, Boolean(isReady));
    });

    // start_game (host)
    socket.on('start_game', (data) => {
      const { partidaId } = data || {};
      try {
        if (!partidaId) return socket.emit('game:error', { message: 'partidaId required' });
        gameService.iniciarPartida(partidaId, socket.id);
      } catch (err) {
        socket.emit('game:error', { message: (err as Error).message });
      }
    });

    // select_cell (r, c, partidaId)
    socket.on('select_cell', (data) => {
      const { partidaId, r, c } = data || {};
      if (!partidaId) return;
      gameService.manejarSeleccion(partidaId, socket.id, Number(r), Number(c));
    });

    // activar_match
    socket.on('activate_match', (data) => {
      const { partidaId } = data || {};
      if (!partidaId) return;
      gameService.activarMatch(partidaId, socket.id).catch(err => {
        console.error('activarMatch error', err);
      });
    });

    // make_move (compatibilidad)
    socket.on('make_move', (data) => {
      // Aquí podrías mapear a select_cell o activate_match según payload
      // Por compatibilidad, si vienen coords -> seleccionamos, si viene 'activate' -> activar
      const { partidaId, moves, activate } = data || {};
      if (activate && partidaId) {
        gameService.activarMatch(partidaId, socket.id).catch(() => {});
      } else if (moves && partidaId) {
        // Accept an array of coords -> add them (simple loop)
        for (const m of moves) {
          gameService.manejarSeleccion(partidaId, socket.id, m.r, m.c);
        }
      }
    });
  });
}
