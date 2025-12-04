/**
 * @file Partida.ts
 * @description Representa una sesión de juego activa en el servidor.
 * 
 * Esta clase actúa como el contenedor principal del estado de una partida, gestionando:
 * - La lista de jugadores conectados.
 * - El tablero de juego.
 * - El estado actual (espera, jugando, finalizada).
 * - La configuración de la partida (tipo, temática, límites).
 */

import { Tablero } from './Tablero.js';
import { Jugador } from './Jugador.js';

/** Estados posibles de una partida. */
export type EstadoPartida = 'espera' | 'ready_to_start' | 'jugando' | 'finalizada';

export class Partida {
    /** Estado actual del ciclo de vida de la partida. */
    public estado: EstadoPartida = 'espera';
    /** Mapa de jugadores conectados, indexados por su Socket ID. */
    public jugadores: Map<string, Jugador> = new Map();
    /** Instancia del tablero de juego asociado a esta partida. */
    public tablero: Tablero;
    /** Socket ID del jugador anfitrión (creador de la sala). */
    public hostSocketID: string | null = null;
    /** Timestamp de inicio real del juego (para cálculos de duración). */
    public startTime: number | null = null;

    /**
     * Constructor de la clase Partida.
     * 
     * @param idPartida - Código único de la partida (ej. 'XJ9-22').
     * @param tipoJuego - Modo de juego ('Match' o 'Tiempo').
     * @param tematica - Temática visual seleccionada.
     * @param numJugadoresMax - Capacidad máxima de la sala.
     * @param tiempoRestanteMs - Tiempo restante (uso interno para timers).
     * @param intervalId - Referencia al intervalo del timer (si aplica).
     * @param matchesRealizados - Contador de matches globales (para modo Match Finito).
     * @param duracionPartida - Duración configurada en minutos (para modo Vs Tiempo).
     */
    constructor(
        public idPartida: string,
        public tipoJuego: 'Match' | 'Tiempo',
        public tematica: string,
        public numJugadoresMax: number,
        public tiempoRestanteMs: number = 0,
        public intervalId: NodeJS.Timeout | null = null,
        public matchesRealizados: number = 0,
        public duracionPartida: number = 0
    ) {
        this.tablero = new Tablero();
    }

    /**
     * Agrega un jugador a la partida.
     * Asigna automáticamente el rol de host al primer jugador que entra.
     * 
     * @param jugador - Instancia del jugador a agregar.
     * @throws Error si la partida ya inició o está llena.
     */
    public agregarJugador(jugador: Jugador) {
        if (this.estado !== 'espera') throw new Error('No se puede unir: partida ya iniciada');
        if (this.jugadores.size >= this.numJugadoresMax) throw new Error('Sala llena');
        
        if (this.jugadores.size === 0) {
            this.hostSocketID = jugador.socketID;
        }
        
        this.jugadores.set(jugador.socketID, jugador);
    }

    /**
     * Elimina a un jugador de la partida.
     * Si el host se va, reasigna el rol al siguiente jugador disponible.
     * 
     * @param socketID - ID del socket del jugador a remover.
     */
    public removerJugador(socketID: string) {
        this.jugadores.delete(socketID);
        if (this.hostSocketID === socketID) {
            if (this.jugadores.size > 0) {
                this.hostSocketID = this.jugadores.keys().next().value || null;
            } else {
                this.hostSocketID = null;
            }
        }
    }

    /**
     * Busca un jugador por su Socket ID.
     * 
     * @param socketID - ID del socket a buscar.
     * @returns La instancia del Jugador o undefined si no existe.
     */
    public obtenerJugador(socketID: string): Jugador | undefined {
        return this.jugadores.get(socketID);
    }

    /**
     * Verifica si la sala ha alcanzado su capacidad máxima.
     * 
     * @returns true si está llena, false en caso contrario.
     */
    public estaLlena(): boolean {
        return this.jugadores.size >= this.numJugadoresMax;
    }

    /**
     * Actualiza el estado de la partida.
     * 
     * @param estado - Nuevo estado.
     */
    public setEstado(estado: EstadoPartida) {
        this.estado = estado;
    }

    /**
     * Obtiene la lista de todos los jugadores como un array.
     * 
     * @returns Array de instancias de Jugador.
     */
    public getJugadores() {
        return Array.from(this.jugadores.values());
    }

    /**
     * Genera un resumen serializable de los jugadores para enviar al cliente.
     * Incluye información de estado (listo, puntaje, host) pero excluye datos internos.
     * 
     * @returns Array de objetos con el resumen de cada jugador.
     */
    public getJugadoresResumen() {
        return Array.from(this.jugadores.values()).map(j => ({
        nickname: j.nickname,
        socketID: j.socketID,
        isReady: j.isReady,
        puntaje: j.puntaje,
        isHost: j.socketID === this.hostSocketID
        }));
    }
}
