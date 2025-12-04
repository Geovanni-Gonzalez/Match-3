/**
 * @file game.sockets.ts
 * @description Manejador de eventos de Socket.IO relacionados con la jugabilidad.
 * 
 * Escucha eventos emitidos por el cliente durante una partida activa, como:
 * - Selección de celdas.
 * - Activación de matches.
 * - Cambios de estado (listo, iniciar juego).
 */

import { Server, Socket } from 'socket.io';
import { GameService } from '../core/services/GameService.js';

/**
 * Registra los listeners de eventos de juego en el servidor Socket.IO.
 * 
 * @param io - Instancia del servidor Socket.IO.
 * @param gameService - Servicio de juego para delegar la lógica.
 */
export function registerGameSockets(io: Server, gameService: GameService) {
  io.on('connection', (socket: Socket) => {
    
    /**
     * Evento: set_ready
     * Descripción: El jugador cambia su estado a "listo" en la sala de espera.
     * Payload: { isReady: boolean, partidaId: string }
     */
    socket.on('set_ready', (data) => {
      const { isReady, partidaId } = data;
      if (!partidaId) return;
      gameService.setReady(partidaId, socket.id, Boolean(isReady));
    });

    /**
     * Evento: request_enter_game
     * Descripción: El anfitrión solicita preparar la partida (ir al tablero).
     * Payload: { partidaId: string }
     */
    socket.on('request_enter_game', (data) => {
      const { partidaId } = data || {};
      try {
        if (!partidaId) return socket.emit('game:error', { message: 'partidaId required' });
        // Lógica movida a GameService
        gameService.prepararPartida(partidaId, socket.id);
      } catch (err) {
        socket.emit('game:error', { message: (err as Error).message });
      }
    });

    /**
     * Evento: start_game
     * Descripción: El anfitrión inicia la cuenta regresiva para comenzar a jugar.
     * Payload: { partidaId: string }
     */
    socket.on('start_game', (data) => {
      const { partidaId } = data || {};
      try {
        if (!partidaId) return socket.emit('game:error', { message: 'partidaId required' });
        gameService.iniciarPartida(partidaId, socket.id);
      } catch (err) {
        socket.emit('game:error', { message: (err as Error).message });
      }
    });

    /**
     * Evento: select_cell
     * Descripción: El jugador selecciona o deselecciona una celda del tablero.
     * Payload: { partidaId: string, r: number, c: number }
     */
    socket.on('select_cell', (data) => {
      const { partidaId, r, c } = data || {};
      if (!partidaId) return;
      gameService.manejarSeleccion(partidaId, socket.id, Number(r), Number(c));
    });

    /**
     * Evento: activate_match
     * Descripción: El jugador intenta validar un match con las celdas seleccionadas.
     * Payload: { partidaId: string }
     */
    socket.on('activate_match', (data) => {
      const { partidaId } = data || {};
      if (!partidaId) return;
      gameService.activarMatch(partidaId, socket.id).catch(err => {
        console.error('activarMatch error', err);
      });
    });

    /**
     * Evento: make_move
     * Descripción: Handler de compatibilidad para selección múltiple o activación.
     * Payload: { partidaId: string, moves?: Array, activate?: boolean }
     */
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
