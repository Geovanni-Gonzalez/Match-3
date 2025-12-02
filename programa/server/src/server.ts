// src/server.ts
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import apiRoutes from './api/index';
import { registerLobbySockets } from './sockets/lobby.sockets';
import { registerGameSockets } from './sockets/game.sockets';
import { registerPlayerSockets } from './sockets/player.sockets';
import { GameService } from './core/services/GameService';

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Instanciar GameService con io
const gameService = new GameService(io);

// Registrar handlers (ellos usan el mismo io/GameService)
registerLobbySockets(io, gameService);
registerGameSockets(io, gameService);
registerPlayerSockets(io, gameService);

export { server, io };
