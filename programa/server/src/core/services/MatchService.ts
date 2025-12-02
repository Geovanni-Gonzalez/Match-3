// src/core/services/MatchService.ts
import { WorkerThreadUtility } from '../workers/workerUtility';
import { Coordenada } from '../../interfaces';
import { Celda } from '../domain/Celda';

export class MatchService {
  /**
   * Valida una cadena de celdas usando la lógica del worker.
   * Retorna { valido, n, celdas } exactamente como tu worker.
   */
  public static async validarCadena(celdas: Coordenada[], tablero: Celda[][]) {
    return WorkerThreadUtility.validarCadena(celdas, tablero);
  }
}
