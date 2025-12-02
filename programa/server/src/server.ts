// src/server.ts
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// IMPORTANTE: importar rutas y sockets siempre con extensión .js (por NodeNext)
import apiRoutes from './api/index.js';
import { registerLobbySockets } from './sockets/lobby.sockets.js';
import { registerGameSockets } from './sockets/game.sockets.js';
import { registerPlayerSockets } from './sockets/player.sockets.js';
import { GameService } from './core/services/GameService.js';

const app = express();

// ----------------------
// CORS – FULL PROTECTION
// ----------------------
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
  })
);

// Manejar preflight (MUY IMPORTANTE)
app.options('*', cors());

// Middlewares
app.use(express.json());

// API REST
app.use('/api', apiRoutes);

// HTTP + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Iniciar lógica de juego (inyección)
const gameService = new GameService(io);

// Registrar sockets
registerLobbySockets(io, gameService);
registerGameSockets(io, gameService);
registerPlayerSockets(io, gameService);

// Exportar para uso en index
export { server, io };
