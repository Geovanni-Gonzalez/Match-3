/**
 * @file types.ts
 * @description Definiciones de tipos compartidos entre Cliente y Servidor.
 */

export interface Coordenada {
    r: number; // fila
    c: number; // columna
}

export interface Celda {
    tipo: number; // ID del tipo de gema (o color)
    estado?: 'libre' | 'seleccion_propia' | 'seleccion_otro' | 'bloqueada';
    seleccionadoPor?: string | null; // ID del socket del jugador
}

export interface Jugador {
    id?: string; // ID interno (BD)
    nickname: string;
    socketID: string;
    isReady: boolean;
    isHost?: boolean;
    puntaje?: number;
    conectado?: boolean;
}

export interface Partida {
    id: string;
    jugadores: Jugador[];
    estado: 'espera' | 'jugando' | 'finalizada';
    tablero?: Celda[][];
    config?: any;
}

export interface GameConfig {
    tipoJuego: 'Match' | 'Tiempo';
    tematica: string;
    numJugadoresMax: number;
    duracion?: number;
}
