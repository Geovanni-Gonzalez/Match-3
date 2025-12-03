// server/src/types/index.ts
import { Celda } from '../core/domain/Celda.js';
import { Jugador } from '../core/domain/Jugador.js';

export interface ITablero {
    matriz: ICelda[][];
    obtenerCelda(r: number, c: number): ICelda;
    actualizarCeldas(coordenadas: Coordenada[]): void;
}

export interface ICelda {
    r: number;
    c: number;
    colorID: string;
    estado: 'libre' | 'seleccion_propia' | 'seleccion_otro';
    establecerEstado(nuevoEstado: string): void;
}

export interface IJugador {
    nickname: string;
    idDB: number;
    socketID: string;
    puntaje: number;
    celdasSeleccionadas: Coordenada[];
    isReady: boolean;
    conectado: boolean;
    obtenerInfoBasica(): JugadorResumen;
    agregarSeleccion(r: number, c: number): void;
    limpiarSelecciones(): void;
    calcularPuntaje(n: number): void;
}

export interface IPartida {
    idPartida: string;
    tipoJuego: 'Match' | 'Tiempo';
    tematica: string;
    estado: 'espera' | 'jugando' | 'finalizada';
    tablero: ITablero;
    jugadores: Map<string, IJugador>;
    matchesRealizados: number;
    duracionPartida: number;
    tiempoRestanteMs: number;
    intervalId: NodeJS.Timeout | null;
    agregarJugador(jugador: Jugador): void;
    eliminarJugador(socketID: string): void;
    setEstado(nuevoEstado: 'espera' | 'jugando' | 'finalizada'): void;
    obtenerJugador(socketID: string): Jugador | undefined;
    getJugadoresResumen(): JugadorResumen[];
}

export interface Coordenada {
    r: number;
    c: number;
}

export interface JugadorResumen {
    nickname: string;
    socketID: string;
    puntaje: number;
    isReady: boolean;
    conectado: boolean;
}

export interface PartidaListItem {
    id: string;
    tipo: 'Match' | 'Tiempo';
    tematica: string;
    jugadores: number;
    maxJugadores: number;
    tiempoRestante: number;
}

export interface GameResult {
    idJugador: number;
    puntaje: number;
    esGanador: boolean;
}

export interface MatchValidationResult {
    valido: boolean;
    n: number;
    celdas: Coordenada[];
}

export interface DBPartidaRow {
    codigo_partida: string;
    tipo_juego: string;
    tematica: string;
    num_jugadores: number;
    fecha_fin: Date | null;
}

export interface DBJugadorRow {
    id_jugador: number;
    nickname: string;
    fecha_registro: Date;
}

export interface DBRankingRow {
    user: string;
    victorias: number;
}
