// server/src/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const apiRoutes = require('./api'); // Importamos las rutas que acabamos de crear

const app = express();
const PORT = 4000;

// Middleware para permitir que el cliente (puerto 3000) hable con el servidor (puerto 4000)
app.use(cors());
app.use(express.json());

// Usar las rutas API REST
app.use('/api', apiRoutes);

// Crear servidor HTTP y adjuntar Socket.io (REQ-001)
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Origen del Cliente React
        methods: ["GET", "POST"]
    }
});

// --- LÓGICA DE WEBSOCKETS ---
io.on('connection', (socket) => {
    console.log(`[Socket] Cliente conectado: ${socket.id}`);

    // Evento: Unirse a una sala de partida (REQ-012)
    socket.on('join_room', (data) => {
        const { partidaId, nickname } = data;
        socket.join(partidaId);
        console.log(`[Socket] ${nickname} entró a la sala ${partidaId}`);
        
        // Avisar a los demás en la sala que alguien entró
        socket.to(partidaId).emit('user_joined', { nickname });
    });

    // Evento: Jugador listo para iniciar
    socket.on('player_ready', (data) => {
        const { partidaId, nickname } = data;
        // Reenviar evento a todos en la sala para actualizar la UI
        io.to(partidaId).emit('update_player_status', { nickname, status: 'READY' });
    });

    // Evento: Bloqueo visual de celda (REQ-020)
    socket.on('select_cell', (data) => {
        const { partidaId, cellId, nickname } = data;
        // Emitir a todos MENOS al que envió (broadcast)
        socket.to(partidaId).emit('cell_locked', { cellId, lockedBy: nickname });
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Cliente desconectado:', socket.id);
    });
});

// Arrancar el servidor
server.listen(PORT, () => {
    console.log(`---------------------------------------`);
    console.log(`Backend corriendo en: http://localhost:${PORT}`);
    console.log(`WebSockets listos`);
    console.log(`---------------------------------------`);
});