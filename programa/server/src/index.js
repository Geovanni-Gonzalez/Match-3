// Importaciones de módulos principales
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
// Importar el Router de la API y la clase Singleton
const apiRouter = require('./api');
const { ServidorPartidas } = require('../dist/classes/ServidorPartidas'); // Importar la clase

// --- Configuración del Servidor ---
const PORT = process.env.PORT || 4000; // Puerto para el servidor HTTP/Socket.IO
const app = express();
const httpServer = http.createServer(app);

// Inicializar ServidorPartidas (Singleton)
const serverManager = ServidorPartidas.getInstance();

// Inicializar Socket.IO Server
// Permite la conexión desde el Frontend (http://localhost:3000)
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000", // Permitir acceso desde el Frontend
        methods: ["GET", "POST"]
    }
});

// --- Middleware ---
app.use(cors()); // Habilitar CORS para permitir solicitudes desde el frontend
app.use(express.json()); // Middleware para parsear cuerpos de solicitud JSON

// --- Rutas REST ---
app.use('/api', apiRouter);

// --- Manejo de Conexiones Socket.IO ---
io.on('connection', (socket) => {
    console.log(`[SOCKET] Cliente conectado: ${socket.id}`);
    
    // Llamar al método del Singleton para registrar la conexión
    serverManager.manejarConexionSocket(socket.id); 

    // Evento de ejemplo para unirse a una partida
    socket.on('unirse_partida', ({ codigo, nickname }) => {
        try {
            const jugador = serverManager.unirseAPartida(codigo, nickname, socket.id);
            socket.join(codigo); // Unir el socket a la sala de la partida
            console.log(`[SOCKET] ${nickname} unido a la sala: ${codigo}`);
            // Aquí podrías emitir un evento solo a ese socket (socket.emit) con el estado inicial.
        } catch (error) {
            console.error(`[ERROR] Fallo al unirse a ${codigo}:`, error.message);
            socket.emit('error_partida', { message: error.message });
        }
    });

    // Evento para activar la lógica de match (Botón)
    socket.on('activar_match', ({ codigo, nickname }) => {
        const partida = serverManager.partidasActivas.get(codigo);
        if (partida && partida.estado === 'jugando') {
            // Dispara el proceso de validación en el Worker Thread
            partida.procesarMatch(nickname);
        }
    });

    // Evento de desconexión
    socket.on('disconnect', () => {
        console.log(`[SOCKET] Cliente desconectado: ${socket.id}`);
        // Lógica para manejar la salida de jugadores de partidas activas
    });
});

// --- Inicio del Servidor ---
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
});

// Exportar IO para usarlo en otras clases si es necesario (ej: Partida.enviarEstadoATodos)
// module.exports = { io };