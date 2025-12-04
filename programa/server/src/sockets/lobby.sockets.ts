// src/sockets/lobby.socket.ts
import { Server, Socket } from 'socket.io';
import { GameService } from '../core/services/GameService.js';
import { ServidorPartidas } from '../core/manager/ServidorPartidas.js';
import { TimerManager } from '../core/manager/TimerManager.js';
import { Console } from 'console';

export function registerLobbySockets(io: Server, gameService: GameService) {
  const servidor = ServidorPartidas.getInstance();
  const timerManager = TimerManager.getInstance();
  timerManager.setSocketServer(io);

  io.on('connection', (socket: Socket) => {
    socket.join("lobby");
    // send current list immediately - get from ServidorPartidas directly
    const partidasDisponibles = gameService.listarPartidasDisponibles();
    socket.emit('partidas:list', partidasDisponibles);


    // client asks for explicit list
    socket.on('partidas:get', () => {
      const partidas = gameService.listarPartidasDisponibles();
      socket.emit('partidas:list', partidas);
    });


    // join_game
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
