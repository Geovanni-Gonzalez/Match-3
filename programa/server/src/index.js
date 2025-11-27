// server/src/index.js
import express from 'express'; // Añadir @types/express si no lo has hecho
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import apiRoutes from './api.js';
import { ServidorPartidas } from './classes/ServidorPartidas.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

const servidorPartidas = ServidorPartidas.getInstance();


io.on('connection', (socket) => {
    console.log('[Socket] Nuevo cliente conectado:', socket.id);

    // Maneja la unión a la partida
    socket.on('join_room', async (data) => {
        const { partidaId, nickname } = data;
        
        try {
            // 1. Llama al método de la clase ServidorPartidas
            const nuevoJugador = servidorPartidas.unirseAPartida(partidaId, nickname, socket.id);
            
            // 2. Si es exitoso, une el socket a la sala
            socket.join(partidaId);
            socket.data.nickname = nickname; // Mantener datos de socket
            socket.data.isReady = false; 

            // 3. Obtener la lista de jugadores actualizada
            const partida = servidorPartidas.partidasActivas.get(partidaId);
            const currentPlayers = Array.from(partida.jugadores.values()).map(j => ({
                nickname: j.nickname,
                socketID: j.socketID,
                isReady: j.isReady // Asume que la clase Jugador tiene un isReady
            }));

            // 4. Notificar a todos en la sala
            io.to(partidaId).emit('update_players_list', currentPlayers);

        } catch (error) {
            console.error(`Error al unirse a la partida ${partidaId}:`, error.message);
            socket.emit('error_join', { message: error.message });
        }
    });

    // Maneja el estado de "listo"
    socket.on('player_ready', (data) => {
        const { partidaId, isReady } = data;
        
        // 1. Actualiza el estado en la clase Jugador/Partida
        const partida = servidorPartidas.partidasActivas.get(partidaId);
        if (partida) {
            const jugador = partida.jugadores.get(socket.id);
            if (jugador) {
                jugador.isReady = isReady; // Asume que Jugador tiene propiedad isReady
            }
        }

        // 2. Notifica a la sala el cambio de estado
        io.to(partidaId).emit('player_status_changed', { socketID: socket.id, isReady });
    });

    // Maneja el inicio del juego
    socket.on('start_game', (data) => {
        const { partidaId } = data;
        console.log(`[Socket] Iniciando partida ${partidaId}`);
        
        const partida = servidorPartidas.partidasActivas.get(partidaId);
        if (partida) {
            // 1. Generar el tablero (idealmente usando un método de la clase Partida)
            // Aquí usamos la función helper temporalmente:
            const tableroInicial = generarTableroAleatorio();
            // Lógica de Partida: partida.iniciar(tableroInicial);
            
            // 2. Enviarlo a todos junto con la señal de inicio
            io.to(partidaId).emit('game_started', { 
                tablero: tableroInicial,
                config: servidorPartidas.obtenerConfiguracion() // Enviar la config también
            });
            
            // 3. Opcional: Actualizar el estado de la partida a 'iniciada'
            partida.estado = 'iniciada'; 
        } else {
            socket.emit('game:error', { message: 'Partida no encontrada para iniciar.' });
        }
    });
    
    // Maneja la desconexión
    socket.on('disconnect', () => {
        console.log('[Socket] Cliente desconectado:', socket.id);
        
        // 1. Itera y limpia el jugador de la partida
        // Mejor añadir un método específico en ServidorPartidas:
        servidorPartidas.manejarDesconexionJugador(socket.id); 
        
        // 2. Notifica a la sala si el jugador estaba en una
        const partidaId = Object.keys(socket.rooms).find(room => room !== socket.id);
        if (partidaId && servidorPartidas.partidasActivas.get(partidaId)) {
            const partida = servidorPartidas.partidasActivas.get(partidaId);
            const currentPlayers = Array.from(partida.jugadores.values()).map(j => ({
                nickname: j.nickname,
                socketID: j.socketID,
                isReady: j.isReady 
            }));
            io.to(partidaId).emit('update_players_list', currentPlayers);
            // Si la partida se cerró por quedar vacía, se puede emitir aquí.
        }
    });
});


server.listen(PORT, () => {
    console.log(`[Server] Corriendo en http://localhost:${PORT}`);
});
