// server/src/api.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); 

// Simulación de Base de Datos en Memoria (Array temporal)
const partidas = [];

// Endpoint: Obtener lista de partidas disponibles (REQ-011)
router.get('/partidas', (req, res) => {
    // Filtramos solo las que están en espera
    const disponibles = partidas.filter(p => p.estado === 'espera');
    
    // Mapeamos para enviar solo la info necesaria al lobby
    res.json(disponibles.map(p => ({
        id: p.id,
        tipo: p.tipoJuego,
        tematica: p.tematica,
        jugadores: p.jugadores.length,
        maxJugadores: p.numJugadoresMax
    })));
});

// Endpoint: Crear nueva partida (REQ-007, REQ-008, REQ-009)
router.post('/partidas', (req, res) => {
    const { tipoJuego, tematica, numJugadoresMax } = req.body;
    
    const nuevaPartida = {
        id: uuidv4(), // ID único
        codigo: uuidv4().substring(0, 6).toUpperCase(), // Código visual
        tipoJuego,
        tematica,
        numJugadoresMax: parseInt(numJugadoresMax) || 2,
        jugadores: [],
        estado: 'espera', // estados: espera, jugando, finalizada
        tablero: [], // Aquí se guardará la matriz
        createdAt: new Date()
    };

    partidas.push(nuevaPartida);
    console.log(`[API] Nueva partida creada. ID: ${nuevaPartida.id} | Temática: ${tematica}`);
    
    res.status(201).json({ 
        message: 'Partida creada exitosamente', 
        codigo: nuevaPartida.id, // Usamos el ID como código de enlace
        partidaId: nuevaPartida.id 
    });
});

module.exports = router;