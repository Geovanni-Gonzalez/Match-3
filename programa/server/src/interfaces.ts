/**
 * @file interfaces.ts
 * @description Definiciones de interfaces y tipos compartidos en el servidor.
 */

/**
 * Representa una posición en el tablero de juego (fila, columna).
 */
export interface Coordenada {
  /** Índice de la fila (0-based) */
  r: number;
  /** Índice de la columna (0-based) */
  c: number;
}
