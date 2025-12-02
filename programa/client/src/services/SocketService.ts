// programa/client/src/services/SocketService.ts
import { Socket } from 'socket.io-client';

export interface JugadorData {
  nickname: string;
  socketID: string;
  isReady: boolean;
  puntaje?: number;
  conectado?: boolean;
}

export interface TableroSerializedCell {
  r: number;
  c: number;
  colorID: string;
  estado: string;
}

export class SocketService {
  private socket: Socket;

  constructor(socketInstance: Socket) {
    if (!socketInstance) throw new Error("SocketService requiere instancia válida de Socket.");
    this.socket = socketInstance;
  }

  // ---------- EMITS ----------
  public createGame(idPartida: string, tipoJuego: string, tematica: string, numJugadoresMax: number) {
    this.socket.emit("create_game", { idPartida, tipoJuego, tematica, numJugadoresMax });
  }

  public joinGame(idPartida: string, nickName: string, jugadorDBId: number) {
    this.socket.emit("join_game", { idPartida, nickName, jugadorDBId });
  }

  public leaveGame(partidaId: string) {
    this.socket.emit("leave_game", { partidaId });
  }

  public setReady(partidaId: string, isReady: boolean) {
    this.socket.emit("set_ready", { partidaId, isReady });
  }

  public startGame(partidaId: string) {
    this.socket.emit("start_game", { partidaId });
  }

  public selectCell(partidaId: string, r: number, c: number) {
    this.socket.emit("select_cell", { partidaId, r, c });
  }

  public activateMatch(partidaId: string) {
    this.socket.emit("activate_match", { partidaId });
  }

  // Fallback legacy
  public sendMoveFallback(partidaId: string, moves: { r: number; c: number }[]) {
    this.socket.emit("make_move", { partidaId, moves });
  }

  // ---------- ON con auto-unsubscribe ----------
  public onPlayersUpdate(callback: (players: JugadorData[]) => void) {
    this.socket.on("players_update", callback);
    return () => this.socket.off("players_update", callback);
  }

  public onBoardUpdate(callback: (data: { tablero: TableroSerializedCell[][] }) => void) {
    this.socket.on("board_update", callback);
    return () => this.socket.off("board_update", callback);
  }

  public onGameStarted(callback: (data: { tablero: TableroSerializedCell[][]; config?: any }) => void) {
    this.socket.on("game_started", callback);
    return () => this.socket.off("game_started", callback);
  }

  public onMatchResult(callback: (data: any) => void) {
    this.socket.on("match_result", callback);
    return () => this.socket.off("match_result", callback);
  }

  public onPlayerStatusChanged(callback: (data: { socketID: string; isReady: boolean }) => void) {
    this.socket.on("player_status_changed", callback);
    return () => this.socket.off("player_status_changed", callback);
  }

  public onAllPlayersReady(callback: (data: { partidaId: string }) => void) {
    this.socket.on("all_players_ready", callback);
    return () => this.socket.off("all_players_ready", callback);
  }
    public onGameCreated(callback: (data: { idPartida: string }) => void) {
    this.socket.on("game_created", callback);
    return () => this.socket.off("game_created", callback);
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
