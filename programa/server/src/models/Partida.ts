import { Jugador } from "./jugador.js";

export class Partida {
    public id: string;
    public jugadores: Jugador[];
    public maxJugadores: number;
    public tablero: any[][]; // Matriz 9x7 (REQ-017)
    public celdasBloqueadas: Map<number, string>; // ID Celda -> ID Jugador (REQ-020)
    public enCurso: boolean;

    constructor(id: string, maxJugadores: number) {
        this.id = id;
        this.maxJugadores = maxJugadores;
        this.jugadores = [];
        this.tablero = []; 
        this.celdasBloqueadas = new Map();
        this.enCurso = false;
        this.inicializarTablero();
    }

    private inicializarTablero() {
        // REQ-018: Generar matriz vacía (9x7)
        const FILAS = 9;
        const COLUMNAS = 7;
        this.tablero = Array.from({ length: FILAS }, (_, r) => 
            Array.from({ length: COLUMNAS }, (_, c) => ({
                id: r * COLUMNAS + c,
                color: null 
            }))
        );
    }

    public agregarJugador(jugador: Jugador): boolean {
        // Verificar si hay espacio y si el jugador no está ya en la partida
        if (this.jugadores.length < this.maxJugadores) {
            this.jugadores.push(jugador);
            return true;
        }
        return false;
    }
    
    public removerJugador(jugadorId: string) {
        this.jugadores = this.jugadores.filter(j => j.id !== jugadorId);
    }

    // Método auxiliar para enviar al frontend solo la info necesaria
    public obtenerInfoJugadores() {
        return this.jugadores.map(j => ({
            nickname: j.nickname,
            isReady: j.isReady
        }));
    }

    // REQ-020: Lógica de bloqueo visual
    public bloquearCelda(celdaId: number, jugadorId: string): boolean {
        if (this.celdasBloqueadas.has(celdaId) && this.celdasBloqueadas.get(celdaId) !== jugadorId) {
            return false; 
        }
        this.celdasBloqueadas.set(celdaId, jugadorId);
        return true;
    }

    public liberarCelda(celdaId: number) {
        this.celdasBloqueadas.delete(celdaId);
    }
}