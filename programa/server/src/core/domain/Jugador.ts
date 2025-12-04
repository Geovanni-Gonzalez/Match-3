/**
 * @file Jugador.ts
 * @description Representa a un usuario conectado dentro de una partida activa.
 * 
 * Esta clase mantiene el estado en tiempo real del jugador, incluyendo:
 * - Identificación (nickname, ID de base de datos, Socket ID).
 * - Estado de juego (puntaje, celdas seleccionadas actualmente).
 * - Estado de conexión (conectado, listo para jugar).
 */

import { Coordenada } from '../../interfaces.js';

export class Jugador {
    /** Puntaje acumulado en la partida actual. */
    public puntaje = 0;
    /** Lista de coordenadas de las celdas que el jugador tiene seleccionadas. */
    public celdasSeleccionadas: Coordenada[] = [];
    /** Indica si el jugador ha presionado "Listo" en el lobby. */
    public isReady = false;
    /** Indica si el socket del jugador está activo. */
    public conectado = true;

    /**
     * Constructor de la clase Jugador.
     * 
     * @param nickname - Nombre visible del jugador.
     * @param idDB - ID único del jugador en la base de datos MySQL.
     * @param socketID - ID del socket de conexión actual.
     */
    constructor(
        public nickname: string,
        public idDB: number,
        public socketID: string
    ) {}

    /**
     * Gestiona la selección de una celda.
     * Si la celda ya estaba seleccionada, la deselecciona (toggle).
     * Si no, la agrega a la lista de selecciones.
     * 
     * @param r - Fila de la celda.
     * @param c - Columna de la celda.
     */
    public agregarCelda(r: number, c: number) {
        const idx = this.celdasSeleccionadas.findIndex(s => s.r === r && s.c === c);
        if (idx > -1) this.celdasSeleccionadas.splice(idx, 1);
        else this.celdasSeleccionadas.push({ r, c });
    }

    /**
     * Vacía la lista de celdas seleccionadas.
     * Se llama después de realizar un match o cuando la selección es inválida.
     */
    public limpiarSelecciones() {
        this.celdasSeleccionadas = [];
    }

    /**
     * Calcula y suma el puntaje basado en el número de celdas emparejadas.
     * Fórmula: Puntos = n^2 (donde n es el número de celdas).
     * 
     * @param n - Número de celdas en el match.
     */
    public calcularPuntaje(n: number) {
        this.puntaje += Math.pow(n, 2);
    }

    /**
     * Devuelve un objeto con la información pública esencial del jugador.
     * Útil para enviar actualizaciones a los clientes sin exponer datos internos sensibles.
     * 
     * @returns Objeto con nickname, idDB, socketID y puntaje.
     */
    public obtenerInfoBasica() {
        return {
            nickname: this.nickname,
            idDB: this.idDB,
            socketID: this.socketID,
            puntaje: this.puntaje
        };
    }
}