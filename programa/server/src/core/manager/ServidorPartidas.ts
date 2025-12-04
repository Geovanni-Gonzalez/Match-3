/**
 * @file ServidorPartidas.ts
 * @description Singleton que gestiona el ciclo de vida de todas las partidas activas en memoria.
 * 
 * Actúa como un repositorio en memoria para:
 * - Crear nuevas instancias de partidas.
 * - Recuperar partidas existentes por ID.
 * - Eliminar partidas finalizadas o expiradas.
 */

import { Partida } from '../domain/Partida.js';
import { Jugador } from '../domain/Jugador.js';
import config from '../../config/config.js';

export class ServidorPartidas {
    private static instance: ServidorPartidas;
    /** Mapa que almacena las partidas activas en memoria, indexadas por su ID. */
    public partidasActivas: Map<string, Partida> = new Map();

    /** Constructor privado para implementar el patrón Singleton. */
    private constructor() {}

    /**
     * Obtiene la instancia única del gestor de partidas.
     * 
     * @returns La instancia singleton de ServidorPartidas.
     */
    public static getInstance() {
        if (!ServidorPartidas.instance) ServidorPartidas.instance = new ServidorPartidas();
        return ServidorPartidas.instance;
    }

    /**
     * Crea una nueva partida y la almacena en memoria.
     * 
     * @param id - Identificador único de la partida.
     * @param tipo - Tipo de juego ('Match' o 'Tiempo').
     * @param tematica - Temática visual.
     * @param max - Número máximo de jugadores.
     * @param duracion - Duración en minutos (opcional, solo para modo Tiempo).
     * @returns La instancia de la partida creada.
     */
    public crearPartida(id: string, tipo: 'Match' | 'Tiempo', tematica: string, max: number, duracion?: number) {
        const p = new Partida(id, tipo, tematica, max, undefined, undefined, undefined, duracion);
        this.partidasActivas.set(id, p);
        return p;
    }

    /**
     * Busca una partida activa por su ID.
     * 
     * @param id - Identificador de la partida.
     * @returns La instancia de la partida o undefined si no existe.
     */
    public obtenerPartida(id: string) {
        return this.partidasActivas.get(id);
    }

    /**
     * Elimina una partida de la memoria.
     * Se debe llamar cuando la partida finaliza o expira por inactividad.
     * 
     * @param id - Identificador de la partida a eliminar.
     */
    public eliminarPartida(id: string) {
        this.partidasActivas.delete(id);
    }
}