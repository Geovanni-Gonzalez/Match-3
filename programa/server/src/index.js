// server/src/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const apiRoutes = require('./api');

const app = express();
const PORT = 4000;

// Constantes del Juego (Mismas que en el cliente)
const FILAS = 9;
const COLUMNAS = 7;
const COLORES = ['#1E90FF', '#FF8C00', '#FF4500', '#32CD32', '#FFD700', '#8A2BE2', '#00CED1']; 

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

// Función Helper para generar tablero
const generarTableroAleatorio = () => {
    const tablero = [];
    for (let fila = 0; fila < FILAS; fila++) {
        const filaArray = [];
        for (let col = 0; col < COLUMNAS; col++) {
            const id = fila * COLUMNAS + col;
            // Elegir color aleatorio (excluyendo el último si es 'vacío' o similar, ajusta según tu lógica)
            const colorIndex = Math.floor(Math.random() * (COLORES.length - 1)); 
            filaArray.push({ id, color: COLORES[colorIndex] });
        }
        tablero.push(filaArray); // Guardamos por filas para facilitar manejo matricial
    }
    // Aplanamos para enviarlo como lista simple si tu frontend lo prefiere así, 
    // pero mantenerlo como matriz 9x7 es útil. Tu frontend actual usa .flat() así que enviaremos matriz.
    return tablero;
};

io.on('connection', (socket) => {
    console.log(`[Socket] Cliente conectado: ${socket.id}`);

    socket.on('join_room', async (data) => {
        const { partidaId, nickname } = data;
        socket.join(partidaId);
        socket.data.nickname = nickname;
        socket.data.isReady = false; 

        const sockets = await io.in(partidaId).fetchSockets();
        const currentPlayers = sockets.map(s => ({
            nickname: s.data.nickname,
            socketID: s.id,
            isReady: s.data.isReady || false
        }));
        io.to(partidaId).emit('update_players_list', currentPlayers);
    });

    socket.on('player_ready', (data) => {
        const { partidaId, isReady } = data;
        socket.data.isReady = isReady;
        io.to(partidaId).emit('player_status_changed', { socketID: socket.id, isReady });
    });

    // --- MODIFICADO: GENERAR Y ENVIAR TABLERO ---
    socket.on('start_game', (data) => {
        const { partidaId } = data;
        console.log(`[Socket] Iniciando partida ${partidaId}`);
        
        // 1. Generar el tablero AUTORITATIVO en el servidor
        const tableroInicial = generarTableroAleatorio();

        // 2. Enviarlo a todos junto con la señal de inicio
        io.to(partidaId).emit('game_started', { tablero: tableroInicial });
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Cliente desconectado:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`[Server] Corriendo en http://localhost:${PORT}`);
});