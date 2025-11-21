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
        res.status(200).json(partidas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la lista de partidas.' });
    }
});

// --- Ruta: Crear una nueva partida (REQ-007, REQ-009) ---
router.post('/partidas', (req, res) => {
    try {
        const { tipoJuego, tematica, numJugadoresMax } = req.body;
        
        if (!tipoJuego || !tematica || !numJugadoresMax) {
            return res.status(400).json({ message: 'Faltan parámetros requeridos.' });
        }
        
        const nuevaPartida = serverManager.crearPartida(tipoJuego, tematica, numJugadoresMax);
        
        res.status(201).json({
            message: 'Partida creada con éxito.',
            codigo: nuevaPartida.idPartida,
            tipo: nuevaPartida.tipoJuego,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la partida.' });
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
        
        res.status(200).json(mockRanking);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el ranking histórico.' });
    }
});

module.exports = router;