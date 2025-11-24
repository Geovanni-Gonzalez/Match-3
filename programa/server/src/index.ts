import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './managers/GameManager.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
// Configuración de Socket.io con CORS para permitir conexión desde el cliente React
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // URL de tu Frontend
        methods: ["GET", "POST"]
    }
});

const gameManager = GameManager.getInstance();

// --- API REST (Para listar partidas en el Lobby - REQ-011) ---
app.get('/api/partidas', (req, res) => {
    const partidas = gameManager.listarPartidasDisponibles();
    res.json(partidas);
});

app.post('/api/partidas', (req, res) => {
    const { maxJugadores } = req.body;
    // Por defecto creamos partidas de 2 jugadores si no se especifica
    const nuevaPartida = gameManager.crearPartida(maxJugadores || 2); 
    res.json({ codigo: nuevaPartida.id });
});

// --- WebSockets (Lógica de Juego en Tiempo Real - REQ-001) ---
io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    // Evento: Unirse a una partida
    socket.on('unirse_partida', (data) => {
        const { codigoPartida, nickname } = data;
        const partida = gameManager.obtenerPartida(codigoPartida);

        if (partida) {
            // Crear jugador y agregarlo
            const nuevoJugador = { 
                id: socket.id, 
                nickname, 
                puntaje: 0, 
                isReady: false 
            };
            // Nota: Aquí deberíamos usar la clase Jugador, adaptamos para simplicidad de socket
            
            // Unir el socket a la "sala" (room) de esa partida
            socket.join(codigoPartida);
            
            // Notificar a todos en la sala que alguien se unió
            io.to(codigoPartida).emit('jugador_unido', {
                jugadores: partida.jugadores.length + 1, // Simulado por ahora
                nickname: nickname
            });
            
            console.log(`${nickname} se unió a la partida ${codigoPartida}`);
        } else {
            socket.emit('error', { message: 'Partida no encontrada' });
        }
    });

    // Evento: Selección de celda (REQ-020 - Bloqueo Visual)
    socket.on('seleccionar_celda', (data) => {
        const { partidaId, celdaId } = data;
        
        // Enviar evento a TODOS en la sala EXCEPTO al remitente
        // Esto permite que los otros vean el bloqueo inmediatamente
        socket.to(partidaId).emit('celda_bloqueada', {
            celdaId: celdaId,
            jugadorId: socket.id
        });
        
        console.log(`Celda ${celdaId} bloqueada por ${socket.id} en partida ${partidaId}`);
    });

    // Evento: Desconexión
    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
        // Aquí iría lógica para sacar al jugador de la partida
    });
});

// --- Iniciar Servidor ---
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`>> Servidor de Match-3 corriendo en puerto ${PORT}`);
});