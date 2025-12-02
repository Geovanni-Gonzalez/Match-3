// server/src/core/domain/Partida.ts
import { Tablero } from './Tablero.js';
import { Jugador } from './Jugador.js';

export type EstadoPartida = 'espera' | 'jugando' | 'finalizada';

export class Partida {
    public estado: EstadoPartida = 'espera';
    public jugadores: Map<string, Jugador> = new Map(); // key = socketID
    public tablero: Tablero;

    constructor(
        public idPartida: string,
        public tipoJuego: 'Match' | 'Tiempo',
        public tematica: string,
        private numJugadoresMax: number
    ) {
        this.tablero = new Tablero();
    }

    public agregarJugador(jugador: Jugador) {
        if (this.estado !== 'espera') throw new Error('No se puede unir: partida ya iniciada');
        if (this.jugadores.size >= this.numJugadoresMax) throw new Error('Sala llena');
        this.jugadores.set(jugador.socketID, jugador);
    }

    public removerJugador(socketID: string) {
        this.jugadores.delete(socketID);
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

    public getJugadoresResumen() {
        return Array.from(this.jugadores.values()).map(j => ({
        nickname: j.nickname,
        socketID: j.socketID,
        isReady: j.isReady,
        puntaje: j.puntaje
        }));
    }
}
