// server/src/index.js
import express from 'express'; 
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import  apiRoutes  from './api.js';
import  {ServidorPartidas}  from './classes/ServidorPartidas';

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


    // Crear partida index.ts
    socket.on('create_game', (data) => {
        const { idPartida, tipoJuego, tematica, numJugadoresMax } = data;
        const nuevaPartida = servidorPartidas.crearPartida(idPartida, tipoJuego, tematica, numJugadoresMax);
        console.log(`[Socket] Partida creada con ID: ${nuevaPartida.idPartida}`);
        socket.emit('game_created', { idPartida: nuevaPartida.idPartida });
    });


    // Maneja la unión a la partida
    socket.on('join_game', async (data) => {
        const { idPartida, nickName, jugadorDBId } = data;
        
        try {
                // 1. Llama al método de la clase ServidorPartidas
                const nuevoJugador = servidorPartidas.unirseAPartida(idPartida, nickName, socket.id, jugadorDBId);
                console.log(`[Socket] Jugador ${nickName} unido a la partida ${idPartida}`);
                // 2. Si es exitoso, une el socket a la sala
                socket.join(idPartida);
                socket.data.nickname = nickName; // Mantener datos de socket
                socket.data.isReady = false; 
                // Notificar al jugador que se unió exitosamente
                socket.emit('joined_game', { idPartida, nickname: nuevoJugador.nickname, socketID: socket.id });
                // 3. Obtener la lista de jugadores actualizada
                const partida = servidorPartidas.partidasActivas.get(idPartida);
                if (!partida) {
                    const message = 'Partida no encontrada';
                    console.error(`Error al obtener partida ${idPartida}: ${message}`);
                    socket.emit('error_join', { message });
                    return;
                }
                const currentPlayers = Array.from(partida.jugadores.values()).map(j => ({
                    nickname: j.nickname,
                    socketID: j.socketID,
                    isReady: j.isReady 
                }));

                // 4. Notificar a todos en la sala
                io.to(idPartida).emit('update_players_list', currentPlayers);
    
            } catch (error: unknown) {
                // Asegurarse de obtener un mensaje seguro desde un error de tipo unknown
                let message = 'Error desconocido';
                if (error instanceof Error && error.message) {
                    message = error.message;
                } else if (typeof error === 'string') {
                    message = error;
                }
                console.error(`Error al unirse a la partida ${idPartida}:`, message);
                socket.emit('error_join', { message });
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
          //  const tableroInicial = generarTableroAleatorio();
            // Lógica de Partida: partida.iniciar(tableroInicial);
            
            // 2. Enviarlo a todos junto con la señal de inicio
            io.to(partidaId).emit('game_started', { 
              //  tablero: tableroInicial,
                config: servidorPartidas.obtenerConfiguracion() // Enviar la config también
            });
            
            // 3. Opcional: Actualizar el estado de la partida a 'iniciada'
            partida.estado = 'jugando'; 
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
        const partida = partidaId ? servidorPartidas.partidasActivas.get(partidaId) : undefined;
        if (partida && partidaId) {
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
