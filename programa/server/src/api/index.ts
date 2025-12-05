/**
 * @file index.ts
 * @description Enrutador principal de la API REST.
 * 
 * Agrega las sub-rutas para jugadores y partidas.
 * Proporciona un endpoint raíz de health check.
 */

import { Router } from 'express';
import jugadorApi from './jugador.api.js';
import partidaApi from './partida.api.js';

const router = Router();

// Rutas de entidades
router.use('/jugador', jugadorApi);
router.use('/partida', partidaApi);

// Health check root
router.get('/', (_, res) => {
    res.json({ message: 'API Match-3 OK' });
});

// Health check endpoint para detección automática
router.get('/health', (_, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

export default router;
