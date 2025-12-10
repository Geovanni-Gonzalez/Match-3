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
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// IMPORTANTE: importar rutas y sockets siempre con extensión .js (por NodeNext)
import apiRoutes from './api/index.js';
import { setGameService } from './api/partida.api.js';
import { registerLobbySockets } from './sockets/lobby.sockets.js';
import { registerGameSockets } from './sockets/game.sockets.js';
import { registerPlayerSockets } from './sockets/player.sockets.js';
import { GameService } from './core/services/GameService.js';
import { TimerManager } from './core/manager/TimerManager.js';
import { ServidorPartidas } from './core/manager/ServidorPartidas.js';

const app = express();

// ----------------------
// Security Middleware
// ----------------------
app.use(helmet());

// Rate Limiting: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// ----------------------
// CORS – Configuración dinámica para localhost y Ngrok
// ----------------------

const corsOptions = {
  origin: true, // Reflect request origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Manejar preflight explícitamente
app.options('*', cors(corsOptions));

// Middlewares
app.use(express.json());

// HTTP + Socket.IO (crear ANTES de iniciar GameService)
const httpServer = http.createServer(app);

/**
 * Instancia principal de Socket.IO.
 * Configurada para permitir conexiones desde cualquier origen (*) temporalmente
 * para facilitar el uso de túneles como Ngrok sin bloqueos estrictos.
 */
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// 1. Instanciar dependencias base
const servidorPartidas = new ServidorPartidas();
const timerManager = new TimerManager();

// 2. Instanciar servicio principal inyectando dependencias
const gameService = new GameService(io, servidorPartidas, timerManager);

// 3. Inyectar servicio en controladores y sockets
setGameService(gameService);

// API REST (ahora con GameService inyectado)
app.use('/api', apiRoutes);

// Registrar sockets
registerLobbySockets(io, gameService);
registerGameSockets(io, gameService);
registerPlayerSockets(io, gameService);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Error no manejado:', err);
  res.status(500).json({ message: 'Error interno del servidor', error: err.message });
});

// Exportar para uso en index
export { httpServer as server, io };
