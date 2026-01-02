/**
 * @file validation.schemas.ts
 * @description Joi validation schemas for API endpoints
 */

import Joi from 'joi';

/**
 * Schema para crear partida
 */
export const crearPartidaSchema = Joi.object({
  tipoJuego: Joi.string().valid('Match', 'Tiempo').required(),
  tematica: Joi.string().valid('Gemas', 'Frutas', 'Animales').required(),
  numJugadoresMax: Joi.number().integer().min(2).max(4).required(),
  duracion: Joi.number().integer().min(1).max(180).optional(),
});

/**
 * Schema para registrar jugador
 */
export const registrarJugadorSchema = Joi.object({
  nickname: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .required()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .messages({
      'string.pattern.base': 'El nickname solo puede contener letras, números, guiones y guiones bajos',
      'string.min': 'El nickname debe tener al menos 3 caracteres',
      'string.max': 'El nickname no puede tener más de 20 caracteres',
    }),
});

/**
 * Schema para agregar jugador a partida
 */
export const agregarJugadorSchema = Joi.object({
  codigoPartida: Joi.string().required(),
  jugadorId: Joi.number().integer().positive().required(),
});

/**
 * Schema para coordenadas
 */
export const coordenadaSchema = Joi.object({
  r: Joi.number().integer().min(0).max(9).required(),
  c: Joi.number().integer().min(0).max(9).required(),
});

/**
 * Schema para selección de celdas
 */
export const seleccionCeldasSchema = Joi.object({
  partidaId: Joi.string().required(),
  celdas: Joi.array().items(coordenadaSchema).min(3).max(10).required(),
});
