/**
 * @file SocketService.ts
 * @description Servicio cliente para la gestión de la comunicación en tiempo real con Socket.IO.
 * 
 * Encapsula la instancia del socket y proporciona métodos tipados para emitir eventos
 * y suscribirse a respuestas del servidor.
 */

import { Socket } from 'socket.io-client';

/**
 * Datos públicos de un jugador en una partida.
 */
export interface JugadorData {
  nickname: string;
  socketID: string;
  isReady: boolean;
  puntaje?: number;
  conectado?: boolean;
  isHost?: boolean;
}

/**
 * Representación serializada de una celda del tablero para el cliente.
 */
export interface TableroSerializedCell {
  r: number;
  c: number;
  colorID: string;
  estado: string;
  seleccionadoPor?: string | null;
}

/**
 * Información resumida de una partida para mostrar en el lobby.
 */
export interface PartidaListItem {
  id: string;
  tipo: string;
  tematica: string;
  jugadores: number;
  jugadoresNombres: string[];
  maxJugadores: number;
  tiempoRestante: number;
  duracionMinutos?: number;
}

export class SocketService {
  private socket: Socket;

  /**
   * Inicializa el servicio con una instancia de Socket.IO.
   * @param socketInstance - Instancia conectada de Socket.IO Client.
   */
  constructor(socketInstance: Socket) {
    if (!socketInstance) throw new Error("SocketService requiere instancia válida de Socket.");
    this.socket = socketInstance;
  }

  // ---------- EMITS (Envío de eventos al servidor) ----------

  /** Solicita la lista actualizada de partidas. */
  public getPartidas() {
    console.log("[SocketService] Emitiendo partidas:get");
    this.socket.emit("partidas:get");
  }

  /** Solicita unirse a una partida específica. */
  public joinGame(idPartida: string, nickName: string, jugadorDBId: number) {
    console.log("[SocketService] Emitiendo join_game:", { idPartida, nickName, jugadorDBId });
    this.socket.emit("join_game", { idPartida, nickName, jugadorDBId });
  }

  /** Abandona la partida actual. */
  public leaveGame(partidaId: string) {
    this.socket.emit("leave_game", { partidaId });
  }

  /** Cambia el estado de "listo" del jugador. */
  public setReady(partidaId: string, isReady: boolean) {
    this.socket.emit("set_ready", { partidaId, isReady });
  }

  /** Inicia la partida (solo host). */
  public startGame(partidaId: string) {
    this.socket.emit("start_game", { partidaId });
  }

  /** Selecciona una celda en el tablero. */
  public selectCell(partidaId: string, r: number, c: number) {
    this.socket.emit("select_cell", { partidaId, r, c });
  }

  /** Intenta activar un match con las celdas seleccionadas. */
  public activateMatch(partidaId: string) {
    this.socket.emit("activate_match", { partidaId });
  }

  /** Solicita información detallada de una partida. */
  public requestGameInfo(partidaId: string) {
    this.socket.emit("request_game_info", { partidaId });
  }

  /** Solicita preparar la partida para entrar al tablero (solo host). */
  public requestEnterGame(partidaId: string) {
    this.socket.emit("request_enter_game", { partidaId });
  }

  // Fallback legacy
  public sendMoveFallback(partidaId: string, moves: { r: number; c: number }[]) {
    this.socket.emit("make_move", { partidaId, moves });
  }

  // ---------- ON (Suscripción a eventos del servidor) ----------
  // Todos los métodos retornan una función para desuscribirse (cleanup).

  public onPartidasList(callback: (lista: PartidaListItem[]) => void) {
    this.socket.on("partidas:list", callback);
    return () => this.socket.off("partidas:list", callback);
  }

  public onPartidaCreated(callback: (p: PartidaListItem) => void) {
    this.socket.on("partida:created", callback);
    return () => this.socket.off("partida:created", callback);
  }

  public onPartidaUpdated(callback: (p: PartidaListItem) => void) {
    this.socket.on("partida:updated", callback);
    return () => this.socket.off("partida:updated", callback);
  }


  public onPartidaDeleted(callback: (data: { partidaId: string }) => void) {
    this.socket.on("partida:deleted_due_timeout", callback);
    return () => this.socket.off("partida:deleted_due_timeout", callback);
  }

  public onTimerTick(callback: (data: { secondsLeft: number, partidaId: string, type?: string }) => void) {
    this.socket.on("game:timer_tick", callback);
    return () => this.socket.off("game:timer_tick", callback);
  }


  public onPlayersUpdate(callback: (players: JugadorData[]) => void) {
    this.socket.on("players_update", callback);
    return () => this.socket.off("players_update", callback);
  }

  public onBoardUpdate(callback: (data: { tablero: TableroSerializedCell[][] }) => void) {
    this.socket.on("board_update", callback);
    return () => this.socket.off("board_update", callback);
  }


  public onMatchResult(callback: (data: any) => void) {
    this.socket.on("match_result", callback);
    return () => this.socket.off("match_result", callback);
  }

  public onMatchInvalid(callback: (data: { reason: string }) => void) {
    this.socket.on("match_invalid", callback);
    return () => this.socket.off("match_invalid", callback);
  }

  public onCellBlocked(callback: (data: { r: number, c: number, by: string }) => void) {
    this.socket.on("cell_blocked", callback);
    return () => this.socket.off("cell_blocked", callback);
  }

  public onPlayerStatusChanged(callback: (data: { socketID: string; isReady: boolean }) => void) {
    this.socket.on("player_status_changed", callback);
    return () => this.socket.off("player_status_changed", callback);
  }

  public onAllPlayersReady(callback: (data: { partidaId: string }) => void) {
    this.socket.on("all_players_ready", callback);
    return () => this.socket.off("all_players_ready", callback);
  }

  public onForceNavigateGame(callback: (data: { partidaId: string, tablero: TableroSerializedCell[][], config: any }) => void) {
    this.socket.on("force_navigate_game", callback);
    return () => this.socket.off("force_navigate_game", callback);
  }

  public onGameCreated(callback: (data: { idPartida: string }) => void) {
    console.log("[SocketService] Recibiendo game_created:", callback);
    this.socket.on("game_created", callback);
    return () => this.socket.off("game_created", callback);
  }

  public onGameInfo(callback: (data: { maxJugadores: number, tematica: string, tipoJuego: string }) => void) {
    this.socket.on("game_info", callback);
    return () => this.socket.off("game_info", callback);
  }

  public onGameCountdown(callback: (data: { seconds: number }) => void) {
    this.socket.on("game:countdown", callback);
    return () => this.socket.off("game:countdown", callback);
  }

  public onGameStarted(callback: (data: { tablero: TableroSerializedCell[][], config: any }) => void) {
    this.socket.on("game_started", callback);
    return () => this.socket.off("game_started", callback);
  }

  public onMatchUpdate(callback: (data: { matchesLeft: number }) => void) {
    this.socket.on("game:match_update", callback);
    return () => this.socket.off("game:match_update", callback);
  }

  public onGameFinished(callback: (data: { resultados: any[] }) => void) {
    this.socket.on("game_finished", callback);
    return () => this.socket.off("game_finished", callback);
  }
  public onError(callback: (data: any) => void) {
    this.socket.on("error_create", callback);
    this.socket.on("error_join", callback);
    this.socket.on("game:error", callback);

    return () => {
      this.socket.off("error_create", callback);
      this.socket.off("error_join", callback);
      this.socket.off("game:error", callback);
    };
  }

  public rawSocket() {
    return this.socket;
  }
}
