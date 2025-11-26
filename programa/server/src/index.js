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

const generarTableroAleatorio = () => {
    const tablero = [];
    for (let fila = 0; fila < FILAS; fila++) {
        const filaArray = [];
        for (let col = 0; col < COLUMNAS; col++) {
            const id = fila * COLUMNAS + col;
            const colorIndex = Math.floor(Math.random() * (COLORES.length - 1)); 
            filaArray.push({ id, color: COLORES[colorIndex] });
        }
        tablero.push(filaArray);
    }
    return tablero;
};

// Algoritmo de Búsqueda (Flood Fill / DFS) para encontrar grupos (REQ-024)
const encontrarGrupo = (tablero, cellId) => {
    const fila = Math.floor(cellId / COLUMNAS);
    const col = cellId % COLUMNAS;
    const colorObjetivo = tablero[fila][col].color;
    const grupo = [];
    const visitados = new Set();

    const busqueda = (f, c) => {
        const id = f * COLUMNAS + c;
        if (
            f < 0 || f >= FILAS || c < 0 || c >= COLUMNAS || // Límites
            visitados.has(id) || // Ya visitado
            tablero[f][c].color !== colorObjetivo // Distinto color
        ) {
            return;
        }

        visitados.add(id);
        grupo.push(id);

        // Buscar en 4 direcciones (Arriba, Abajo, Izq, Der)
        // Nota: REQ-024 menciona 8 direcciones, para simplificar iniciamos con 4, 
        // puedes agregar diagonales añadiendo (f+1, c+1), etc.
        busqueda(f + 1, c);
        busqueda(f - 1, c);
        busqueda(f, c + 1);
        busqueda(f, c - 1);
        // Diagonales (Opcional según dificultad deseada, el REQ dice 8)
        busqueda(f + 1, c + 1);
        busqueda(f - 1, c - 1);
        busqueda(f + 1, c - 1);
        busqueda(f - 1, c + 1);
    };

    busqueda(fila, col);
    return grupo;
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

    // --- INICIO DEL JUEGO ---
    socket.on('start_game', async (data) => {
        const { partidaId } = data;
        
        const tableroInicial = generarTableroAleatorio();
        const sockets = await io.in(partidaId).fetchSockets();
        
        // Inicializar estado en el servidor
        partidasActivas[partidaId] = {
            tablero: tableroInicial,
            jugadores: sockets.map(s => ({
                nickname: s.data.nickname,
                socketID: s.id,
                puntaje: 0
            }))
        };

        console.log(`[Game] Partida ${partidaId} iniciada. Jugadores:`, partidasActivas[partidaId].jugadores);

        // Enviar estado inicial completo
        io.to(partidaId).emit('game_started', { 
            tablero: tableroInicial,
            jugadores: partidasActivas[partidaId].jugadores 
        });
    });

    socket.on('select_cell', (data) => {
        const { partidaId, cellId, nickname } = data;
        socket.to(partidaId).emit('cell_locked', { cellId, lockedBy: nickname });
    });

    socket.on('deselect_cell', (data) => {
        const { partidaId, cellId } = data;
        socket.to(partidaId).emit('cell_unlocked', { cellId });
    });

    // --- LÓGICA DE MATCH (REQ-024, REQ-025, REQ-026, REQ-027) ---
    socket.on('attempt_match', (data) => {
        const { partidaId, cellId, nickname } = data;
        const juego = partidasActivas[partidaId];

        if (!juego) return; // Seguridad

        // 1. Encontrar el grupo de celdas conectadas
        const grupo = encontrarGrupo(juego.tablero, cellId);

        // 2. Validar tamaño del grupo (REQ-025: Mínimo 3)
        if (grupo.length >= 3) {
            console.log(`[Game] Match exitoso de ${grupo.length} celdas por ${nickname}`);
            
            // 3. Calcular puntaje (REQ-027: n^2)
            const puntosGanados = Math.pow(grupo.length, 2);
            
            // 4. Actualizar puntaje del jugador
            const jugadorIndex = juego.jugadores.findIndex(j => j.nickname === nickname);
            if (jugadorIndex !== -1) {
                juego.jugadores[jugadorIndex].puntaje += puntosGanados;
            }

            // 5. Regenerar celdas (REQ-026)
            // Simplemente cambiamos el color de las celdas matcheadas por nuevos aleatorios
            grupo.forEach(id => {
                const f = Math.floor(id / COLUMNAS);
                const c = id % COLUMNAS;
                const nuevoColorIndex = Math.floor(Math.random() * (COLORES.length - 1));
                juego.tablero[f][c].color = COLORES[nuevoColorIndex];
            });

            // 6. Emitir actualización a TODOS (Tablero nuevo + Puntajes nuevos)
            io.to(partidaId).emit('game_update', {
                tablero: juego.tablero,
                jugadores: juego.jugadores,
                mensaje: `¡${nickname} hizo un match de ${grupo.length} y ganó ${puntosGanados} pts!`
            });

            // Liberar el bloqueo visual de la celda que originó el match
            io.to(partidaId).emit('cell_unlocked', { cellId });

        } else {
            // Match inválido
            console.log(`[Game] Intento fallido de ${nickname}. Solo ${grupo.length} celdas.`);
            socket.emit('match_failed', { message: "Se necesitan al menos 3 celdas del mismo color." });
        }
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Cliente desconectado');
    });
});

server.listen(PORT, () => {
    console.log(`[Server] Corriendo en http://localhost:${PORT}`);
});