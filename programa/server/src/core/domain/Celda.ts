/**
 * @file Celda.ts
 * @description Representa una celda individual dentro del tablero de juego.
 * 
 * Esta clase gestiona:
 * - La posición (fila, columna) de la celda.
 * - El color de la gema contenida.
 * - El estado actual (libre, seleccionada, bloqueada).
 * - La referencia al jugador que la ha seleccionado (si aplica).
 */

import { Coordenada } from '../../interfaces.js';

export class Celda {
    /** Identificador del color de la gema (ej. 'red', 'blue'). */
    public colorID: string;
    /** Estado actual de la celda para control de concurrencia y visualización. */
    public estado: 'libre' | 'seleccion_propia' | 'seleccion_otro' | 'bloqueada' = 'libre';
    /** ID del socket del jugador que tiene seleccionada esta celda. */
    public seleccionadoPor: string | null = null;

    /**
     * Constructor de la clase Celda.
     * 
     * @param fila - Índice de la fila en el tablero (0-based).
     * @param columna - Índice de la columna en el tablero (0-based).
     * @param colorOColores - Un color específico (string) o una lista de colores posibles para generar uno aleatorio.
     */
    constructor(
        public fila: number,
        public columna: number,
        colorOColores: string | string[]
    ) {
        if (typeof colorOColores === 'string') {
            // Color específico proporcionado
            this.colorID = colorOColores;
        } else {
            // Array de colores: generar uno aleatorio
            this.colorID = this.generarColorAleatorio(colorOColores);
        }
        this.estado = 'libre';
    }

    /**
     * Genera un color aleatorio a partir de una lista de colores válidos.
     * 
     * @param coloresValidos - Array de strings con los colores disponibles.
     * @returns Un string con el color seleccionado aleatoriamente.
     */
    private generarColorAleatorio(coloresValidos: string[]): string {
        const index = Math.floor(Math.random() * coloresValidos.length);
        return coloresValidos[index];
    }

    /**
     * Asigna un nuevo color a la celda.
     * Útil cuando se rellenan celdas vacías tras un match.
     * 
     * @param nuevoColor - El nuevo color a asignar.
     */
    public asignarColor(nuevoColor: string): void {
        this.colorID = nuevoColor;
    }

    /**
     * Actualiza el estado de la celda.
     * 
     * @param nuevoEstado - El nuevo estado ('libre', 'seleccion_propia', etc.).
     */
    public establecerEstado(nuevoEstado: 'libre' | 'seleccion_propia' | 'seleccion_otro' | 'bloqueada') {
        this.estado = nuevoEstado;
    }

    /**
     * Devuelve las coordenadas de la celda en un formato estándar.
     * 
     * @returns Objeto Coordenada { r, c }.
     */
    public obtenerCoordenadas(): Coordenada {
        return { r: this.fila, c: this.columna };
    }
}