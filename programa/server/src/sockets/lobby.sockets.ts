// src/sockets/lobby.socket.ts
import { Server, Socket } from 'socket.io';
import { GameService } from '../core/services/GameService.js';
import { ServidorPartidas } from '../core/manager/ServidorPartidas.js';
import { TimerManager } from '../core/manager/TimerManager.js';

export function registerLobbySockets(io: Server, gameService: GameService) {
  const servidor = ServidorPartidas.getInstance();
  const timerManager = TimerManager.getInstance();
  timerManager.setSocketServer(io);

  io.on('connection', (socket: Socket) => {
    // create_game
    socket.on('create_game', (data) => {
      try {
        const { idPartida, tipoJuego, tematica, numJugadoresMax } = data;
        gameService.crearPartida(idPartida, tipoJuego, tematica, numJugadoresMax);
        console.log(`[Socket][lobby] Partida creada: ${idPartida} (${tipoJuego}, ${tematica}, max:${numJugadoresMax})`);
        socket.emit('game_created', { idPartida });
      } catch (err) {
        socket.emit('error_create', { message: (err as Error).message || 'Error creating game' });
      }
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
          io.to(idPartida).emit('players_update', partida.getJugadoresResumen());
        }
      } catch (err) {
        socket.emit('error_join', { message: (err as Error).message || 'Error joining' });
      }
    });
  });
}
