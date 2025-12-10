/**
 * @file index.ts
 * @description Definiciones de tipos e interfaces globales del servidor.
 *
 * Contiene las interfaces que definen la estructura de datos para:
 * - Entidades del dominio (Tablero, Celda, Jugador, Partida).
 * - Objetos de transferencia de datos (DTOs) para comunicación con el cliente.
 * - Tipos de retorno de consultas a la base de datos.
 */

import { Jugador } from '../core/domain/Jugador.js';

/**
 * Interfaz que define la estructura y comportamiento de un Tablero.
 */
export interface ITablero {
  /** Matriz bidimensional de celdas que representa el grid del juego. */
  matriz: ICelda[][];
  /**
   * Obtiene una celda específica por sus coordenadas.
   * @param r Fila.
   * @param c Columna.
   */
  obtenerCelda(r: number, c: number): ICelda;
  /**
   * Actualiza el estado de un conjunto de celdas (ej. al hacer match).
   * @param coordenadas Lista de coordenadas a actualizar.
   */
  actualizarCeldas(coordenadas: Coordenada[]): void;
}

/**
 * Interfaz que define la estructura y comportamiento de una Celda.
 */
export interface ICelda {
  /** Índice de fila. */
  r: number;
  /** Índice de columna. */
  c: number;
  /** Identificador del color o tipo de la celda. */
  colorID: string;
  /** Estado actual de la celda. */
  estado: 'libre' | 'seleccion_propia' | 'seleccion_otro';
  /**
   * Cambia el estado de la celda.
   * @param nuevoEstado Nuevo estado a asignar.
   */
  establecerEstado(nuevoEstado: string): void;
}

/**
 * Interfaz que define la estructura y comportamiento de un Jugador.
 */
export interface IJugador {
  /** Nombre visible del jugador. */
  nickname: string;
  /** ID único en la base de datos. */
  idDB: number;
  /** ID de la conexión de socket actual. */
  socketID: string;
  /** Puntaje acumulado en la partida actual. */
  puntaje: number;
  /** Lista de celdas seleccionadas actualmente por el jugador. */
  celdasSeleccionadas: Coordenada[];
  /** Indica si el jugador ha marcado que está listo para iniciar. */
  isReady: boolean;
  /** Estado de conexión del jugador. */
  conectado: boolean;
  /**
   * Devuelve un resumen de la información del jugador para enviar al cliente.
   */
  obtenerInfoBasica(): JugadorResumen;
  /**
   * Agrega una celda a la selección del jugador.
   * @param r Fila.
   * @param c Columna.
   */
  agregarSeleccion(r: number, c: number): void;
  /**
   * Limpia todas las selecciones del jugador.
   */
  limpiarSelecciones(): void;
  /**
   * Calcula y suma puntos basados en la cantidad de celdas matcheadas.
   * @param n Número de celdas en el match.
   */
  calcularPuntaje(n: number): void;
}

/**
 * Interfaz que define la estructura y comportamiento de una Partida.
 */
export interface IPartida {
  /** Identificador único de la partida (código de acceso). */
  idPartida: string;
  /** Modo de juego configurado. */
  tipoJuego: 'Match' | 'Tiempo';
  /** Temática visual de la partida. */
  tematica: string;
  /** Estado actual del ciclo de vida de la partida. */
  estado: 'espera' | 'jugando' | 'finalizada';
  /** Instancia del tablero de juego. */
  tablero: ITablero;
  /** Mapa de jugadores conectados, indexado por socketID. */
  jugadores: Map<string, IJugador>;
  /** Contador de matches realizados (para modo 'Match'). */
  matchesRealizados: number;
  /** Duración total configurada en segundos (para modo 'Tiempo'). */
  duracionPartida: number;
  /** Tiempo restante en milisegundos. */
  tiempoRestanteMs: number;
  /** Referencia al intervalo del temporizador. */
  intervalId: NodeJS.Timeout | null;
  /**
   * Agrega un jugador a la partida.
   * @param jugador Instancia del jugador.
   */
  agregarJugador(jugador: Jugador): void;
  /**
   * Elimina un jugador de la partida.
   * @param socketID ID del socket del jugador a eliminar.
   */
  eliminarJugador(socketID: string): void;
  /**
   * Cambia el estado de la partida.
   * @param nuevoEstado Nuevo estado.
   */
  setEstado(nuevoEstado: 'espera' | 'jugando' | 'finalizada'): void;
  /**
   * Busca un jugador por su socketID.
   * @param socketID ID del socket.
   */
  obtenerJugador(socketID: string): Jugador | undefined;
  /**
   * Obtiene una lista resumen de todos los jugadores.
   */
  getJugadoresResumen(): JugadorResumen[];
}

/**
 * Representa una posición en el tablero (fila, columna).
 */
export interface Coordenada {
  r: number;
  c: number;
}

/**
 * DTO con información pública de un jugador.
 */
export interface JugadorResumen {
  nickname: string;
  socketID: string;
  puntaje: number;
  isReady: boolean;
  conectado: boolean;
}

/**
 * DTO para listar partidas disponibles en el lobby.
 */
export interface PartidaListItem {
  id: string;
  tipo: 'Match' | 'Tiempo';
  tematica: string;
  jugadores: number;
  maxJugadores: number;
  tiempoRestante: number;
  /** Lista de nombres de jugadores (opcional, para mostrar en UI). */
  jugadoresNombres?: string[];
  /** Duración en minutos (opcional, para modo Tiempo). */
  duracionMinutos?: number;
}

/**
 * Resultado final de un jugador en una partida.
 */
export interface GameResult {
  idJugador: number;
  puntaje: number;
  esGanador: boolean;
}

/**
 * Resultado de la validación de un intento de match.
 */
export interface MatchValidationResult {
  /** Indica si el match es válido. */
  valido: boolean;
  /** Número de celdas involucradas en el match. */
  n: number;
  /** Lista de coordenadas que forman el match. */
  celdas: Coordenada[];
}

/**
 * Estructura de fila para la tabla 'partidas' en la base de datos.
 */
export interface DBPartidaRow {
  codigo_partida: string;
  tipo_juego: string;
  tematica: string;
  num_jugadores: number;
  fecha_fin: Date | null;
}

/**
 * Estructura de fila para la tabla 'jugadores' en la base de datos.
 */
export interface DBJugadorRow {
  id_jugador: number;
  nickname: string;
  fecha_registro: Date;
}

/**
 * Estructura de fila para consultas de ranking.
 */
export interface DBRankingRow {
  user: string;
  victorias: number;
}
