/**
 * @file Tablero.ts
 * @description Representa la cuadrícula de juego (Grid) donde ocurren las interacciones.
 * 
 * Esta clase es responsable de:
 * - Generar y mantener la matriz de celdas.
 * - Asegurar que el tablero siempre tenga movimientos válidos (matches posibles).
 * - Actualizar el estado del tablero tras un match exitoso.
 */

import { Celda } from './Celda.js';
import config from '../../config/config.js';
import { Coordenada } from '../../interfaces.js';

export class Tablero {
    /** Matriz bidimensional de celdas que representa el grid del juego. */
    public matriz: Celda[][] = [];

    /**
     * Constructor de la clase Tablero.
     * Inicializa la matriz y asegura que sea jugable.
     */
    constructor() {
        this.inicializar();
    }

    /**
     * Inicializa el tablero generando celdas aleatorias.
     * Intenta hasta 20 veces generar un tablero que contenga al menos un match válido.
     * Si falla, fuerza la creación de un match artificialmente.
     */
    private inicializar() {
        const R = config.TAMANIO_FILA;
        const C = config.TAMANIO_COLUMNA;
        const colores = config.COLORES_VALIDOS;

        let intentos = 0;
        let tieneMatches = false;

        // Intentar generar un tablero válido hasta 20 veces
        do {
            for (let r = 0; r < R; r++) {
                this.matriz[r] = [];
                for (let c = 0; c < C; c++) {
                    this.matriz[r][c] = new Celda(r, c, colores);
                }
            }
            tieneMatches = this.verificarExistenciaDeMatches();
            intentos++;
        } while (!tieneMatches && intentos < 20);

        // Si aún no hay matches, forzar uno garantizado
        if (!tieneMatches) {
            console.log("[Tablero] Forzando match inicial tras intentos fallidos.");
            this.forzarMatch();
        }
    }

    /**
     * Obtiene una celda específica del tablero de forma segura.
     * 
     * @param r - Índice de fila.
     * @param c - Índice de columna.
     * @returns La instancia de Celda o undefined si las coordenadas son inválidas.
     */
    public obtenerCelda(r: number, c: number) {
        if (r < 0 || c < 0) return undefined;
        if (!this.matriz[r] || !this.matriz[r][c]) return undefined;
        return this.matriz[r][c];
    }

    /**
     * Actualiza las celdas especificadas con nuevos colores aleatorios.
     * Se llama después de que un jugador completa un match exitoso.
     * Garantiza que el tablero resultante siga teniendo matches posibles.
     * 
     * @param lista - Lista de coordenadas de las celdas a regenerar.
     */
    public actualizarCeldas(lista: Coordenada[]) {
        const colores = config.COLORES_VALIDOS;
        for (const { r, c } of lista) {
            this.matriz[r][c] = new Celda(r, c, colores);
        }

        // Asegurar que sigan existiendo matches después de la actualización
        if (!this.verificarExistenciaDeMatches()) {
            console.log("[Tablero] Forzando match tras actualización.");
            this.forzarMatch();
        }
    }

    /**
     * Verifica si existe al menos una combinación válida de 3 colores en el tablero.
     * Revisa horizontal, vertical y diagonales.
     * 
     * @returns true si existe al menos un match posible.
     */
    private verificarExistenciaDeMatches(): boolean {
        const R = this.matriz.length;
        const C = this.matriz[0].length;

        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                const color = this.matriz[r][c].colorID;
                if (!color) continue;

                // Horizontal
                if (c + 2 < C &&
                    this.matriz[r][c + 1].colorID === color &&
                    this.matriz[r][c + 2].colorID === color) return true;

                // Vertical
                if (r + 2 < R &&
                    this.matriz[r + 1][c].colorID === color &&
                    this.matriz[r + 2][c].colorID === color) return true;

                // Diagonal Down-Right
                if (r + 2 < R && c + 2 < C &&
                    this.matriz[r + 1][c + 1].colorID === color &&
                    this.matriz[r + 2][c + 2].colorID === color) return true;

                // Diagonal Down-Left
                if (r + 2 < R && c - 2 >= 0 &&
                    this.matriz[r + 1][c - 1].colorID === color &&
                    this.matriz[r + 2][c - 2].colorID === color) return true;
            }
        }
        return false;
    }

    /**
     * Fuerza la creación de un match de 3 celdas del mismo color en una posición aleatoria.
     * Se utiliza como mecanismo de seguridad (fallback) para evitar tableros "muertos" (sin movimientos).
     */
    private forzarMatch() {
        const R = this.matriz.length;
        const C = this.matriz[0].length;
        const colores = config.COLORES_VALIDOS;
        const color = colores[Math.floor(Math.random() * colores.length)];

        // Intentar colocar un match en posición aleatoria (50 intentos)
        for (let i = 0; i < 50; i++) {
            const r = Math.floor(Math.random() * R);
            const c = Math.floor(Math.random() * C);
            const dir = Math.floor(Math.random() * 2); // 0: Horiz, 1: Vert

            if (dir === 0 && c + 2 < C) {
                this.matriz[r][c].asignarColor(color);
                this.matriz[r][c+1].asignarColor(color);
                this.matriz[r][c+2].asignarColor(color);
                return;
            }
            if (dir === 1 && r + 2 < R) {
                this.matriz[r][c].asignarColor(color);
                this.matriz[r+1][c].asignarColor(color);
                this.matriz[r+2][c].asignarColor(color);
                return;
            }
        }

        // Fallback determinista: Centro Horizontal
        const midR = Math.floor(R / 2);
        const midC = Math.floor(C / 2);
        if (midC + 2 < C) {
            this.matriz[midR][midC].asignarColor(color);
            this.matriz[midR][midC+1].asignarColor(color);
            this.matriz[midR][midC+2].asignarColor(color);
        } else {
            // Fallback extremo (0,0) Horizontal
            this.matriz[0][0].asignarColor(color);
            this.matriz[0][1].asignarColor(color);
            this.matriz[0][2].asignarColor(color);
        }
    }
}