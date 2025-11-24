import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './managers/GameManager.js';
import { Jugador } from './models/jugador.js'; // Importamos la clase Jugador

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const gameManager = GameManager.getInstance();

// --- API REST ---
app.get('/api/partidas', (req, res) => {
    const partidas = gameManager.listarPartidasDisponibles();
    res.json(partidas);
});

app.post('/api/partidas', (req, res) => {
    const { maxJugadores } = req.body;
    const nuevaPartida = gameManager.crearPartida(maxJugadores || 2); 
    res.json({ codigo: nuevaPartida.id });
});

// --- WebSockets ---
io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    // Evento: Unirse a una partida (Sala de Espera)
    socket.on('unirse_partida', (data) => {
        const { codigoPartida, nickname } = data;
        const partida = gameManager.obtenerPartida(codigoPartida);

        if (partida) {
            // 1. Crear el Jugador real
            const nuevoJugador = new Jugador(socket.id, nickname);
            
            // 2. Intentar agregarlo a la partida
            const agregado = partida.agregarJugador(nuevoJugador);

            if (agregado) {
                socket.join(codigoPartida);
                
                // 3. Enviar confirmación al usuario que se unió
                // Le enviamos la lista actual de jugadores para que pinte la sala
                socket.emit('unido_exitosamente', { 
                    codigoPartida,
                    jugadores: partida.obtenerInfoJugadores() 
                });

                // 4. Notificar a TODOS en la sala (incluido el nuevo) la nueva lista de jugadores
                io.to(codigoPartida).emit('actualizar_sala', {
                    jugadores: partida.obtenerInfoJugadores()
                });
                
                console.log(`${nickname} se unió a la partida ${codigoPartida}. (${partida.jugadores.length}/${partida.maxJugadores})`);
            } else {
                socket.emit('error', { message: 'La partida está llena o ya iniciada.' });
            }
        } else {
            socket.emit('error', { message: 'Partida no encontrada' });
        }
    });

    // Evento: Jugador listo para iniciar (Opcional, para el botón "Listo")
    // ... aquí iría esa lógica luego

    // Evento: Selección de celda (Juego)
    socket.on('seleccionar_celda', (data) => {
        const { partidaId, celdaId } = data;
        socket.to(partidaId).emit('celda_bloqueada', {
            celdaId: celdaId,
            jugadorId: socket.id
        });
    });

    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
        // Aquí deberíamos remover al jugador de la partida si está en sala de espera
    });
});

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`>> Servidor de Match-3 corriendo en puerto ${PORT}`);
});