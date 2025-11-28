import { Socket } from 'socket.io-client';

// Tipos de datos que el servidor puede enviar (ejemplo)
interface TableroData {
    // ... datos del tablero ...
}

interface JugadorData {
    // ... datos del jugador ...
}

/**
 * SocketService
 * Encapsula la lógica de comunicación con el servidor a través de Socket.IO.
 * Los componentes de React SÓLO interactúan con este repositorio.
 */
export class SocketService {
    private socket: Socket;

    constructor(socketInstance: Socket) {
        if (!socketInstance) {
            throw new Error("SocketService requiere una instancia de Socket válida.");
        }
        this.socket = socketInstance;
    }

    // =======================================================
    // 1. MÉTODOS PARA EMITIR EVENTOS (Acciones del Cliente)
    // =======================================================


    /**
     * Emite un evento para crear una nueva partida.
     * @param tipoJuego Tipo de juego para la nueva partida.
     * @param tematica Temática de la partida.
     * @param numJugadoresMax Número máximo de jugadores permitidos.
     */

    public createGame(idPartida: string, tipoJuego: string, tematica: string, numJugadoresMax: number): void {
        this.socket.emit('create_game', { idPartida, tipoJuego, tematica, numJugadoresMax });
        console.log(`[SocketService] Emitido: create_game (ID: ${idPartida}, Tipo: ${tipoJuego}, Temática: ${tematica}, Max Jugadores: ${numJugadoresMax})`);
    }
    /**
     * Emite un evento para que el jugador se una a una partida existente.
     * @param gameId ID de la partida a la que unirse.
     */
    public joinGame(gameId: string, nickName: string, jugadorDBId: number): void {
        this.socket.emit('join_game', { gameId, nickName, jugadorDBId });
        console.log(`[SocketService] Emitido: join_game para ID: ${gameId}`);
    }

    /**
     * Emite la selección de celdas al servidor para su validación.
     * @param coords Las coordenadas seleccionadas por el jugador.
     */
    public sendMove(coords: { r: number, c: number }[]): void {
        this.socket.emit('make_move', { moves: coords });
        console.log(`[Repo] Emitido: make_move con ${coords.length} celdas.`);
    }

    /**
     * Emite un evento para notificar al servidor que el jugador está listo.
     * @param isReady Estado de listo del jugador.
     */
    public setReady(isReady: boolean): void {
        this.socket.emit('set_ready', { isReady });
        console.log(`[Repo] Emitido: set_ready (listo: ${isReady}).`);
    }


    // =======================================================
    // 2. MÉTODOS PARA SUSCRIBIRSE A EVENTOS (Respuestas del Servidor)
    // =======================================================
    
    /**
     * Suscribe un callback a las actualizaciones del estado del tablero.
     * @param callback Función a ejecutar cuando el tablero es actualizado.
     * @returns Función de limpieza para cancelar la suscripción.
     */
    public onBoardUpdate(callback: (data: TableroData) => void): () => void {
        this.socket.on('board_update', callback);
        return () => {
            this.socket.off('board_update', callback);
        };
    }
    
    /**
     * Suscribe un callback a las actualizaciones del estado de los jugadores en la sala.
     * @param callback Función a ejecutar cuando la lista de jugadores cambie.
     * @returns Función de limpieza.
     */
    public onPlayersUpdate(callback: (players: JugadorData[]) => void): () => void {
        this.socket.on('players_update', callback);
        return () => {
            this.socket.off('players_update', callback);
        };
    }
    public onGameCreated(callback: (data: { partidaId: string }) => void): () => void {
        this.socket.on('game_created', callback);
        return () => {
            this.socket.off('game_created', callback);
        };
    }


    public onJoinedGame(callback: (data: { partidaId: string, nickname: string, socketID: string }) => void): () => void {
        this.socket.on('joined_game', callback);
        return () => {
            this.socket.off('joined_game', callback);
        };
    }

    // Implementar más métodos on... según sea necesario (onGameStart, onGameOver, onError, etc.)
}