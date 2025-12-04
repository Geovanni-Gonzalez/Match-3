// src/server.ts
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// IMPORTANTE: importar rutas y sockets siempre con extensión .js (por NodeNext)
import apiRoutes from './api/index.js';
import { setGameService } from './api/partida.api.js';
import { registerLobbySockets } from './sockets/lobby.sockets.js';
import { registerGameSockets } from './sockets/game.sockets.js';
import { registerPlayerSockets } from './sockets/player.sockets.js';
import { GameService } from './core/services/GameService.js';
import { TimerManager } from './core/manager/TimerManager.js';

const app = express();

// ----------------------
// CORS – FULL PROTECTION (Updated for Ngrok)
// ----------------------
const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Permitir requests sin origen (ej. Postman o server-to-server)
  if (!origin) return callback(null, true);
  
  // Permitir localhost y dominios de ngrok
  if (origin.includes('localhost') || origin.includes('ngrok-free.app')) {
    callback(null, true);
  } else {
    console.warn(`Bloqueado por CORS: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  }
};

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
  })
);

// Manejar preflight (MUY IMPORTANTE)
app.options('*', cors({ origin: corsOrigin, credentials: true }));

// Middlewares
app.use(express.json());

// HTTP + Socket.IO (crear ANTES de iniciar GameService)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permitir todo para evitar problemas con Ngrok
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Iniciar lógica de juego (inyección)
const gameService = new GameService(io);

// Inyectar GameService en el router de partidas
setGameService(gameService);

// API REST (ahora con GameService inyectado)
app.use('/api', apiRoutes);

TimerManager.getInstance().setSocketServer(io);

// Registrar sockets
registerLobbySockets(io, gameService);
registerGameSockets(io, gameService);
registerPlayerSockets(io, gameService);

// Exportar para uso en index
export { server, io };
