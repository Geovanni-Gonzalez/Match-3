// server/src/api.js
const express = require('express');
const router = express.Router();
// Importar la clase Singleton y la clase Jugador (para crear instancias)
const { ServidorPartidas } = require('./classes/ServidorPartidas');

// Obtener la única instancia del gestor de partidas
const serverManager = ServidorPartidas.getInstance();

// --- Ruta: Listar partidas disponibles (REQ-011) ---
router.get('/partidas', (req, res) => {
    try {
        const partidas = serverManager.obtenerPartidasDisponibles();
        res.status(200).json({
            success: true,
            total: partidas.length,
            partidas: partidas
        });
    } catch (error) {
        console.error('[API] Error al obtener partidas:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener la lista de partidas.' 
        });
    }
});

// --- Ruta: Crear una nueva partida (REQ-007, REQ-008, REQ-009) ---
router.post('/partidas', (req, res) => {
    try {
        const { nickname, tipoJuego, tematica, numJugadoresMax, duracionMinutos } = req.body;
        
        console.log('\n========== API: CREAR PARTIDA ==========');
        console.log('[API] Datos recibidos:', JSON.stringify(req.body, null, 2));
        
        // Validar parámetros requeridos
        if (!nickname || !tipoJuego || !tematica || !numJugadoresMax) {
            console.log('[API] ✗ Error: Faltan parámetros requeridos');
            return res.status(400).json({ 
                success: false,
                message: 'Faltan parámetros requeridos: nickname, tipoJuego, tematica, numJugadoresMax' 
            });
        }
        
        // Validar tipo de juego
        if (tipoJuego !== 'Match' && tipoJuego !== 'Tiempo') {
            console.log('[API] ✗ Error: Tipo de juego inválido');
            return res.status(400).json({
                success: false,
                message: 'Tipo de juego inválido. Debe ser "Match" o "Tiempo"'
            });
        }
        
        // Crear partida
        const nuevaPartida = serverManager.crearPartida(
            nickname,
            tipoJuego, 
            tematica, 
            parseInt(numJugadoresMax),
            duracionMinutos ? parseInt(duracionMinutos) : undefined
        );
        
        console.log('[API] ✓ Partida creada exitosamente');
        console.log('========================================\n');
        
        res.status(201).json({
            success: true,
            message: 'Partida creada con éxito.',
            partida: {
                codigo: nuevaPartida.idPartida,
                tipo: nuevaPartida.tipoJuego,
                tematica: nuevaPartida.tematica,
                jugadoresMaximos: nuevaPartida.getNumJugadoresMax(),
                duracionMinutos: duracionMinutos || null
            }
        });
    } catch (error) {
        console.error('[API] Error al crear partida:', error.message);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error al crear la partida.' 
        });
    }
});

// --- Ruta: Unirse a una partida (REQ-005, REQ-012) ---
router.post('/partidas/:codigo/unirse', (req, res) => {
    try {
        const { codigo } = req.params;
        const { nickname, socketID } = req.body;
        
        console.log('\n========== API: UNIRSE A PARTIDA ==========');
        console.log('[API] Código:', codigo);
        console.log('[API] Nickname:', nickname);
        
        // Validar parámetros
        if (!nickname) {
            return res.status(400).json({
                success: false,
                message: 'El nickname es requerido'
            });
        }
        
        // Generar socketID temporal si no se proporciona
        const socket = socketID || `socket_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        // Unirse a la partida
        const jugador = serverManager.unirseAPartida(codigo, nickname, socket);
        
        console.log('[API] ✓ Jugador unido exitosamente');
        console.log('===========================================\n');
        
        res.status(200).json({
            success: true,
            message: 'Te has unido a la partida exitosamente',
            jugador: {
                nickname: jugador.nickname,
                socketID: jugador.socketID
            }
        });
    } catch (error) {
        console.error('[API] Error al unirse a partida:', error.message);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// --- Ruta: Obtener información de una partida específica ---
router.get('/partidas/:codigo', (req, res) => {
    try {
        const { codigo } = req.params;
        const partida = serverManager.partidasActivas.get(codigo);
        
        if (!partida) {
            return res.status(404).json({
                success: false,
                message: 'Partida no encontrada'
            });
        }
        
        const info = partida.obtenerInformacion();
        res.status(200).json({
            success: true,
            partida: info
        });
    } catch (error) {
        console.error('[API] Error al obtener partida:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información de la partida'
        });
    }
});

// --- Ruta: Obtener ranking histórico (REQ-032) ---
router.get('/ranking', async (req, res) => {
    try {
        // En un entorno real, esta ruta llamaría al DBManager para ejecutar la consulta SQL:
        /*
        const rankingData = await DBManager.obtenerRankingGlobal();
        res.status(200).json(rankingData);
        */
        
        // Mock de datos para el ranking
        const mockRanking = [
            { nickname: 'PlayerMax', puntaje: 520, tematica: 'Gemas', fecha: '2025-11-20' },
            { nickname: 'Neo', puntaje: 480, tematica: 'Monstruos', fecha: '2025-11-19' },
            { nickname: 'Alfa', puntaje: 450, tematica: 'Gemas', fecha: '2025-11-18' },
        ];
        
        res.status(200).json({
            success: true,
            ranking: mockRanking
        });
    } catch (error) {
        console.error('[API] Error al obtener ranking:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener el ranking histórico.' 
        });
    }
});

module.exports = router;