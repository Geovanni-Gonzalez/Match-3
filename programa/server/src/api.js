// server/src/api.js
import express, { Router } from 'express';
import { DBManager } from './db/dbManager.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();

// Simulación de Base de Datos en Memoria (Array temporal)
const partidas = [];

// Endpoint: Registrar jugador (o buscar por nickname)
router.post('/registrar_jugador', async (req, res) => {
    const { nickname } = req.body;
    
    if (!nickname) {
        return res.status(400).json({ message: 'El nickname es obligatorio.' });
    }

    try {
        // Llama al método estático para registrar o buscar el ID en la DB
        const jugadorId = await DBManager.registrarJugador(nickname);
        
        // El servidor devuelve el ID del jugador, que es la llave única
        res.status(200).json({ 
            message: 'Registro exitoso',
            jugadorId: jugadorId,
            nickname: nickname
        });

    } catch (error) {
        console.error('Error al registrar/buscar jugador en DB:', error);
        res.status(500).json({ message: 'Error interno al procesar el registro.' });
    }
});

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
router.post('/crear_partida', (req, res) => {
    const { tipoJuego, tematica, numJugadoresMax } = req.body;
    if (!tipoJuego || !tematica || !numJugadoresMax) {
        return res.status(400).json({ message: 'Faltan datos para crear la partida.' });
    }
    //Generar código único para la partida, de 5 caracteres
    const codigoPartida = uuidv4().slice(0, 5).toUpperCase();
    // Llamar al DBManager para registrar la partida en la base de datos
    DBManager.registrarPartida(codigoPartida, tipoJuego, tematica, numJugadoresMax)
    return res.status(201).json({
        message: 'Partida creada exitosamente.',
        partidaId: codigoPartida
    });
});



export default router;