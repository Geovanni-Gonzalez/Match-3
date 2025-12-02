// server/src/sockets/player.socket.ts
import { Server, Socket } from 'socket.io';
import { GameService } from '../core/services/GameService.js';

export function registerPlayerSockets(io: Server, gameService: GameService) {
  io.on('connection', (socket: Socket) => {
    socket.on('disconnect', (reason) => {
      gameService.manejarDesconexion(socket.id);
    });

    /**
     * reconnect_player:
     * data: { partidaId?: string, jugadorDBId: number }
     * Cliente llama con su idDB y opcional partidaId para "re-attach" a la partida.
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
