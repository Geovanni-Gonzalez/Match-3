import { Socket } from "socket.io-client";

interface JugadorData {
    nickname: string;
    socketID: string;
    isReady: boolean;
}

export class SocketService {
    private socket: Socket;

    constructor(socketInstance: Socket) {
        if (!socketInstance) {
            throw new Error("SocketService requiere una instancia de Socket válida.");
        }
        this.socket = socketInstance;
    }

    // =======================================================
    // 1. EMITIR EVENTOS
    // =======================================================

    public createGame(idPartida: string, tipoJuego: string, tematica: string, numJugadoresMax: number): void {
        this.socket.emit("create_game", {
            idPartida,
            tipoJuego,
            tematica,
            numJugadoresMax
        });

        console.log(
            `[SocketService] Emitido: create_game → ${idPartida}, tipo=${tipoJuego}, tema=${tematica}`
        );
    }

    public joinGame(idPartida: string, nickName: string, jugadorDBId: number): void {
        this.socket.emit("join_game", { idPartida, nickName, jugadorDBId });
        console.log(
            `[SocketService] Emitido: join_game → Partida=${idPartida}, Nick=${nickName}, DBID=${jugadorDBId}`
        );
    }

    public setReady(isReady: boolean): void {
        this.socket.emit("set_ready", { isReady });
        console.log(`[SocketService] Emitido: set_ready (${isReady})`);
    }

    public startGame(): void {
        this.socket.emit("start_game");
        console.log("[SocketService] Emitido: start_game");
    }

    public sendMove(coords: { r: number; c: number }[]): void {
        this.socket.emit("make_move", { moves: coords });
        console.log(`[SocketService] Emitido: make_move (${coords.length} celdas)`);
    }

    // =======================================================
    // 2. ESCUCHAR EVENTOS (con unsubscribe)
    // =======================================================

    public onPlayersUpdate(callback: (players: JugadorData[]) => void): () => void {
        this.socket.on("players_update", callback);

        return () => {
            this.socket.off("players_update", callback);
        };
    }

    public onGameCreated(callback: (data: { idPartida: string }) => void): () => void {
        this.socket.on("game_created", callback);
        return () => this.socket.off("game_created", callback);
    }

    public onJoinedGame(
        callback: (data: { idPartida: string; nickname: string; socketID: string }) => void
    ): () => void {
        this.socket.on("joined_game", callback);
        return () => this.socket.off("joined_game", callback);
    }

    public onStartGame(callback: (data: { idPartida: string }) => void): () => void {
        this.socket.on("start_game", callback);
        return () => this.socket.off("start_game", callback);
    }

    public onGameStarted(
        callback: (data: { tablero: any; idPartida: string }) => void
    ): () => void {
        this.socket.on("game_started", callback);
        return () => this.socket.off("game_started", callback);
    }
}
