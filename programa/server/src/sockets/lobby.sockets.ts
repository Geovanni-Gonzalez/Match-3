/**
 * @file lobby.sockets.ts
 * @description Manejador de eventos de Socket.IO relacionados con el Lobby y la gestión de salas.
 * 
 * Escucha eventos para:
 * - Listar partidas disponibles.
 * - Unirse a una partida existente.
 * - Solicitar información de una partida.
 */

import { Server, Socket } from 'socket.io';
import { GameService } from '../core/services/GameService.js';
import { ServidorPartidas } from '../core/manager/ServidorPartidas.js';
import { TimerManager } from '../core/manager/TimerManager.js';
import { Console } from 'console';

/**
 * Registra los listeners de eventos del lobby en el servidor Socket.IO.
 * 
 * @param io - Instancia del servidor Socket.IO.
 * @param gameService - Servicio de juego para delegar la lógica.
 */
export function registerLobbySockets(io: Server, gameService: GameService) {
  const servidor = ServidorPartidas.getInstance();
  const timerManager = TimerManager.getInstance();
  timerManager.setSocketServer(io);

  io.on('connection', (socket: Socket) => {
    // Al conectar, unirse al canal "lobby" y enviar lista actual
    socket.join("lobby");
    const partidasDisponibles = gameService.listarPartidasDisponibles();
    socket.emit('partidas:list', partidasDisponibles);

    /**
     * Evento: partidas:get
     * Descripción: El cliente solicita explícitamente la lista de partidas.
     */
    socket.on('partidas:get', () => {
      const partidas = gameService.listarPartidasDisponibles();
      socket.emit('partidas:list', partidas);
    });

    /**
     * Evento: join_game
     * Descripción: Un jugador solicita unirse a una partida específica.
     * Payload: { idPartida, nickName, jugadorDBId }
     */
    socket.on('join_game', async (data) => {
      try {
        const { idPartida, nickName, jugadorDBId } = data;
        const nuevoJugador = gameService.unirseAPartida(idPartida, nickName, socket.id, jugadorDBId);
        const segundosRestantes = timerManager.getRemainingTime(idPartida);

        // Unirse a la sala de Socket.io
        socket.join(idPartida);
        socket.data.nickname = nickName;
        socket.data.isReady = false;
        socket.emit('joined_game', { idPartida, nickname: (await nuevoJugador).nickname, socketID: socket.id });
        socket.emit('game:timer_tick', { secondsLeft: segundosRestantes });

        // Emitir lista actualizada
        const partida = servidor.obtenerPartida(idPartida);
        if (partida) {
          socket.emit('game_info', { 
            maxJugadores: partida.numJugadoresMax, 
            tematica: partida.tematica, 
            tipoJuego: partida.tipoJuego 
          });
          io.to(idPartida).emit('players_update', partida.getJugadoresResumen());
        }
      } catch (err) {
        console.log('[Socket][lobby] Error joining game:', err);
        socket.emit('error_join', { message: (err as Error).message || 'Error joining' });
      }
    });

    /**
     * Evento: request_game_info
     * Descripción: Solicita detalles de una partida (configuración, jugadores).
     * Payload: { partidaId }
     */
    socket.on('request_game_info', (data) => {
      const { partidaId } = data;
      const partida = servidor.obtenerPartida(partidaId);
      if (partida) {
        socket.emit('game_info', {
          maxJugadores: partida.numJugadoresMax,
          tematica: partida.tematica,
          tipoJuego: partida.tipoJuego
        });
        socket.emit('players_update', partida.getJugadoresResumen());
      }
    });

    socket.on('disconnect', () => {
      // nothing here; GameService handles per-socket disconnection elsewhere
    });
  });
}
