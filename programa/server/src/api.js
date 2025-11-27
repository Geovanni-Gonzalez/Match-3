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
    const partidasFormateadas = disponibles.map(p => ({
        codigo: p.id,
        tipo: p.tipoJuego,
        tematica: p.tematica,
        jugadores: p.jugadores.length,
        maxJugadores: p.numJugadoresMax,
        tiempoRestante: 3600, // Tiempo por defecto
        estado: p.estado,
        nicknames: p.jugadores.map(j => j.nickname),
        duracionMinutos: p.duracionMinutos
    }));
    
    res.json({
        success: true,
        total: partidasFormateadas.length,
        partidas: partidasFormateadas
    });
});

// Endpoint: Crear nueva partida (REQ-007, REQ-008, REQ-009)
router.post('/partidas', (req, res) => {
    const { tipoJuego, tematica, numJugadoresMax, nickname, socketID, duracionMinutos } = req.body;
    
    const nuevaPartida = {
        id: uuidv4(), // ID único
        codigo: uuidv4().substring(0, 6).toUpperCase(), // Código visual
        tipoJuego,
        tematica,
        numJugadoresMax: parseInt(numJugadoresMax) || 2,
        jugadores: [], // El creador se agregará después
        estado: 'espera', // estados: espera, jugando, finalizada
        tablero: [], // Aquí se guardará la matriz
        duracionMinutos: duracionMinutos,
        createdAt: new Date()
    };
    
    // Agregar al creador como primer jugador (líder)
    if (nickname && socketID) {
        nuevaPartida.jugadores.push({ nickname, socketID, isReady: false });
        console.log(`[API] ${nickname} creó y se unió a partida ${nuevaPartida.id} como líder`);
    }

    partidas.push(nuevaPartida);
    console.log(`[API] Nueva partida creada. ID: ${nuevaPartida.id} | Temática: ${tematica}`);
    
    res.status(201).json({ 
        success: true,
        message: 'Partida creada exitosamente',
        partida: {
            id: nuevaPartida.id,
            codigo: nuevaPartida.codigo,
            tipoJuego: nuevaPartida.tipoJuego,
            tematica: nuevaPartida.tematica,
            duracionMinutos: nuevaPartida.duracionMinutos
        },
        partidaId: nuevaPartida.id
    });
});

// Endpoint: Unirse a una partida existente
router.post('/partidas/:id/unirse', (req, res) => {
    const { id } = req.params;
    const { nickname, socketID } = req.body;
    
    const partida = partidas.find(p => p.id === id);
    
    if (!partida) {
        return res.status(404).json({ success: false, message: 'Partida no encontrada' });
    }
    
    if (partida.estado !== 'espera') {
        return res.status(400).json({ success: false, message: 'La partida ya ha iniciado' });
    }
    
    if (partida.jugadores.length >= partida.numJugadoresMax) {
        return res.status(400).json({ success: false, message: 'La partida está llena' });
    }
    
    // Verificar si el jugador ya está en la partida
    if (partida.jugadores.find(j => j.nickname === nickname)) {
        return res.status(400).json({ success: false, message: 'Ya estás en esta partida' });
    }
    
    // Agregar jugador
    partida.jugadores.push({ nickname, socketID, isReady: false });
    
    console.log(`[API] ${nickname} se unió a partida ${id}. Jugadores: ${partida.jugadores.length}/${partida.numJugadoresMax}`);
    
    res.json({
        success: true,
        message: 'Te has unido a la partida',
        partida: {
            id: partida.id,
            jugadores: partida.jugadores.length,
            maxJugadores: partida.numJugadoresMax
        }
    });
});

// Endpoint: Obtener información de una partida específica
router.get('/partidas/:id', (req, res) => {
    const { id } = req.params;
    const partida = partidas.find(p => p.id === id);
    
    if (!partida) {
        return res.status(404).json({ success: false, message: 'Partida no encontrada' });
    }
    
    res.json({
        success: true,
        partida: {
            id: partida.id,
            codigo: partida.codigo,
            tipoJuego: partida.tipoJuego,
            tematica: partida.tematica,
            numJugadoresMax: partida.numJugadoresMax,
            jugadores: partida.jugadores,
            estado: partida.estado,
            duracionMinutos: partida.duracionMinutos
        }
    });
});

module.exports = router;