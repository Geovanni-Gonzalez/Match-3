// server/src/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const apiRoutes = require('./api');

const app = express();
const PORT = 4000;

// Constantes
const FILAS = 9;
const COLUMNAS = 7;
const COLORES = ['#1E90FF', '#FF8C00', '#FF4500', '#32CD32', '#FFD700', '#8A2BE2', '#00CED1']; 

// --- MEMORIA DEL JUEGO ---
// Aquí guardaremos el estado de cada partida activa
const partidasActivas = {}; 
// Estructura: { partidaId: { tablero: [], jugadores: [{nickname, puntaje, socketID}] } }

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

// --- FUNCIONES AUXILIARES ---
// (Eliminadas: generarTableroAleatorio y encontrarGrupo - ahora manejadas por clases TypeScript)

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

    // --- INICIO DEL JUEGO ---
    socket.on('start_game', async (data) => {
        try {
            const { partidaId, tipoJuego, tematica, duracion } = data;
            
            console.log(`[Socket] Iniciando partida ${partidaId}...`);
            
            // Importar las clases TypeScript compiladas desde dist
            const { Partida } = require('../dist/classes/Partida');
            const { Jugador } = require('../dist/classes/Jugador');
            
            // Obtener código visual de la partida desde el API
            const apiRouter = require('./api');
            const partidaData = apiRouter.partidas.find(p => p.id === partidaId);
            const codigoVisual = partidaData ? partidaData.codigo : null;
            
            const sockets = await io.in(partidaId).fetchSockets();
            
            if (sockets.length === 0) {
                console.error('[Socket] No hay jugadores en la sala');
                return;
            }
            
            // Configuración del juego
            const config = {
                TAMANIO_FILA: 9,
                TAMANIO_COLUMNA: 7,
                COLORES_VALIDOS: ['azul', 'naranja', 'rojo', 'verde', 'amarillo', 'morado'],
                TIEMPO_VIDA_PARTIDA_MIN: 60
            };
            
            // Crear instancia de Partida con las clases TypeScript
            const partida = new Partida(
                partidaId, 
                tipoJuego || 'Match', 
                tematica || 'General',
                sockets.length, // numJugadoresMax = número de jugadores actuales
                config,
                duracion,
                codigoVisual // Pasar código visual
            );
            
            // Agregar jugadores
            sockets.forEach(s => {
                const jugador = new Jugador(s.data.nickname, s.id);
                partida.agregarJugador(jugador);
            });

            // Inicializar estado en el servidor
            partidasActivas[partidaId] = { partida };

            console.log(`[Game] Partida ${partidaId} iniciada con ${sockets.length} jugadores`);

            // Enviar estado inicial completo con info de la partida
            io.to(partidaId).emit('game_started', { 
                tablero: partida.obtenerEstadoTablero(),
                jugadores: partida.obtenerJugadores(),
                tipoJuego: partida.tipoJuego,
                tematica: partida.tematica,
                duracionMinutos: partida.duracionMinutos || null
            });
            
        } catch (error) {
            console.error('[Socket] Error al iniciar partida:', error);
            socket.emit('error_match', { mensaje: 'Error al iniciar la partida: ' + error.message });
        }
    });

    // --- SELECCIONAR CELDA: Detecta grupo y bloquea para el jugador ---
    socket.on('select_cell', (data) => {
        const { partidaId, fila, columna, nickname } = data;
        const juego = partidasActivas[partidaId];

        if (!juego || !juego.partida) {
            console.log(`[Socket] Partida ${partidaId} no encontrada`);
            return;
        }

        // Llamar al método de la clase Partida
        const resultado = juego.partida.seleccionarCelda(nickname, fila, columna);

        if (resultado.exito) {
            // Notificar a TODOS que este grupo está bloqueado
            io.to(partidaId).emit('grupo_bloqueado', {
                nickname,
                grupo: resultado.grupo,
                mensaje: resultado.mensaje,
                tablero: juego.partida.obtenerEstadoTablero()
            });
        } else {
            // Notificar solo al jugador del error
            socket.emit('error_seleccion', { mensaje: resultado.mensaje });
        }
    });

    // --- CANCELAR SELECCIÓN: Libera el grupo bloqueado ---
    socket.on('cancel_selection', (data) => {
        const { partidaId, nickname } = data;
        const juego = partidasActivas[partidaId];

        if (!juego || !juego.partida) return;

        const resultado = juego.partida.cancelarSeleccion(nickname);

        if (resultado.exito) {
            // Notificar a todos que el grupo fue liberado
            io.to(partidaId).emit('grupo_liberado', { 
                nickname,
                tablero: juego.partida.obtenerEstadoTablero()
            });
        }
    });

    // --- CONFIRMAR MATCH: Procesa el match del jugador ---
    socket.on('confirm_match', (data) => {
        const { partidaId, nickname } = data;
        const juego = partidasActivas[partidaId];

        if (!juego || !juego.partida) return;

        const resultado = juego.partida.confirmarMatch(nickname);

        if (resultado.exito) {
            // Enviar tablero actualizado y puntajes a TODOS
            io.to(partidaId).emit('game_update', {
                tablero: juego.partida.obtenerEstadoTablero(),
                jugadores: juego.partida.obtenerJugadores(),
                mensaje: resultado.mensaje,
                puntos: resultado.puntos,
                nicknameQueHizoMatch: nickname // Identificar quién hizo el match
            });

            // Verificar si el juego ha finalizado
            if (resultado.juegoFinalizado) {
                io.to(partidaId).emit('game_finished', {
                    ganador: resultado.ganador,
                    mensaje: 'Juego finalizado',
                    tematica: juego.partida.tematica,
                    partidaId: juego.partida.codigoVisual || partidaId
                });
            }
        } else {
            socket.emit('error_match', { mensaje: resultado.mensaje });
        }
    });

    // --- TIEMPO AGOTADO: Finaliza el juego en modo Tiempo ---
    socket.on('tiempo_agotado', (data) => {
        const { partidaId } = data;
        const juego = partidasActivas[partidaId];

        if (!juego || !juego.partida) return;

        juego.partida.finalizarJuego();
        const ganador = juego.partida.obtenerGanador();

        io.to(partidaId).emit('game_finished', {
            ganador: ganador,
            mensaje: 'Se agotó el tiempo',
            tematica: juego.partida.tematica,
            partidaId: juego.partida.codigoVisual || partidaId
        });
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Cliente desconectado');
    });
});

server.listen(PORT, () => {
    console.log(`[Server] Corriendo en http://localhost:${PORT}`);
});