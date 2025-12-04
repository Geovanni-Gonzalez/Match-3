/**
 * @file server.ts
 * @description Configuración principal de la aplicación Express y Socket.IO.
 * 
 * Este módulo:
 * - Configura los middlewares de Express (CORS, JSON).
 * - Inicializa el servidor HTTP.
 * - Configura la instancia de Socket.IO con soporte para CORS.
 * - Inyecta las dependencias (GameService) en los controladores y sockets.
 * - Registra las rutas de la API REST y los eventos de WebSockets.
 */

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

/**
 * Función dinámica para validar el origen de las peticiones CORS.
 * Permite conexiones desde localhost y dominios de Ngrok.
 * 
 * @param origin - El origen de la petición HTTP.
 * @param callback - Función de retorno para permitir o denegar el acceso.
 */
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
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
    credentials: true,
    preflightContinue: false,
  })
);

// Manejar preflight (MUY IMPORTANTE)
app.options('*', cors({ 
  origin: corsOrigin, 
  credentials: true, 
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"] 
}));

// Middlewares
app.use(express.json());

// HTTP + Socket.IO (crear ANTES de iniciar GameService)
const server = http.createServer(app);

/**
 * Instancia principal de Socket.IO.
 * Configurada para permitir conexiones desde cualquier origen (*) temporalmente
 * para facilitar el uso de túneles como Ngrok sin bloqueos estrictos.
 */
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
