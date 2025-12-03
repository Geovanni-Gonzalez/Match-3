// server/src/core/domain/Partida.ts
import { Tablero } from './Tablero.js';
import { Jugador } from './Jugador.js';

export type EstadoPartida = 'espera' | 'jugando' | 'finalizada';

export class Partida {
    public estado: EstadoPartida = 'espera';
    public jugadores: Map<string, Jugador> = new Map(); // key = socketID
    public tablero: Tablero;
    public hostSocketID: string | null = null;

    constructor(
        public idPartida: string,
        public tipoJuego: 'Match' | 'Tiempo',
        public tematica: string,
        public numJugadoresMax: number,
        public tiempoRestanteMs: number = 0,
        public intervalId: NodeJS.Timeout | null = null,
        public matchesRealizados: number = 0,
        public duracionPartida: number = 0 // En minutos, para modo Vs Tiempo
    ) {
        this.tablero = new Tablero();
    }

    public agregarJugador(jugador: Jugador) {
        if (this.estado !== 'espera') throw new Error('No se puede unir: partida ya iniciada');
        if (this.jugadores.size >= this.numJugadoresMax) throw new Error('Sala llena');
        
        if (this.jugadores.size === 0) {
            this.hostSocketID = jugador.socketID;
        }
        
        this.jugadores.set(jugador.socketID, jugador);
    }

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

    public obtenerJugador(socketID: string): Jugador | undefined {
        return this.jugadores.get(socketID);
    }

    public estaLlena(): boolean {
        return this.jugadores.size >= this.numJugadoresMax;
    }

    public setEstado(estado: EstadoPartida) {
        this.estado = estado;
    }

    //Obtener jugadores de una partida
    public getJugadores() {
        return Array.from(this.jugadores.values());
    }



    // Obtener jugadores resumen
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
