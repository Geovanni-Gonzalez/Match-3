/**
 * @file validate.middleware.ts
 * @description Middleware para validación de requests con Joi
 */

import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import Logger from './Logger.js';

/**
 * Middleware factory para validar request body con Joi schema
 */
export const validateBody = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retornar todos los errores
      stripUnknown: true, // Remover campos no definidos en el schema
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      Logger.warn('[Validation] Request inválido', {
        path: req.path,
        errors: errorMessages,
      });

      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: errorMessages,
      });
    }

    // Reemplazar req.body con el valor validado y sanitizado
    req.body = value;
    next();
  };
};

/**
 * Middleware factory para validar query params
 */
export const validateQuery = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      Logger.warn('[Validation] Query params inválidos', {
        path: req.path,
        errors: errorMessages,
      });

      return res.status(400).json({
        message: 'Parámetros de consulta inválidos',
        errors: errorMessages,
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Middleware factory para validar params de ruta
 */
export const validateParams = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      Logger.warn('[Validation] Route params inválidos', {
        path: req.path,
        errors: errorMessages,
      });

      return res.status(400).json({
        message: 'Parámetros de ruta inválidos',
        errors: errorMessages,
      });
    }

    req.params = value;
    next();
  };
};
