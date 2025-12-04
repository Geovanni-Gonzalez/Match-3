/**
 * @file player.sockets.ts
 * @description Manejador de eventos de Socket.IO relacionados con la gestión de jugadores.
 * 
 * Se encarga de:
 * - Manejar desconexiones abruptas.
 * - Gestionar intentos de reconexión de jugadores.
 */

import { Server, Socket } from 'socket.io';
import { GameService } from '../core/services/GameService.js';

/**
 * Registra los listeners de eventos de jugador en el servidor Socket.IO.
 * 
 * @param io - Instancia del servidor Socket.IO.
 * @param gameService - Servicio de juego para delegar la lógica.
 */
export function registerPlayerSockets(io: Server, gameService: GameService) {
  io.on('connection', (socket: Socket) => {
    
    /**
     * Evento: disconnect
     * Descripción: Se dispara automáticamente cuando un cliente pierde la conexión.
     * Acción: Notifica al servicio para actualizar el estado del jugador y la partida.
     */
    socket.on('disconnect', (reason) => {
      gameService.manejarDesconexion(socket.id);
    });

    /**
     * Evento: reconnect_player
     * Descripción: Un cliente intenta recuperar su sesión tras una desconexión.
     * Payload: { partidaId?: string, jugadorDBId: number }
     * 
     * Si tiene éxito, reasocia el nuevo socketID al jugador existente.
     */
    socket.on('reconnect_player', async (data) => {
      try {
        const { partidaId, jugadorDBId } = data || {};
        if (!jugadorDBId) return socket.emit('reconnect:error', { message: 'jugadorDBId requerido' });

        const result = await gameService.reconnectPlayer(partidaId, Number(jugadorDBId), socket.id);
        if (result && result.partidaId) {
          socket.join(result.partidaId);
          // Emitir estado de sala actualizado
          io.to(result.partidaId).emit('players_update', result.jugadoresResumen);
          socket.emit('reconnect:ok', { partidaId: result.partidaId });
        } else {
          socket.emit('reconnect:not_found', { message: 'No se encontró sesión para reconectar' });
        }
      } catch (err) {
        console.error('[Socket][player] reconnect_player error', err);
        socket.emit('reconnect:error', { message: (err as Error).message || 'Error reconectando' });
      }
    });
  });
}
