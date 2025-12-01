import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { SocketService } from "../services/SocketService";

interface JugadorData {
    nickname: string;
    socketID: string;
    isReady: boolean;
}

interface TableroData {
    filas: number;
    columnas: number;
    celdas: string[][];
}

export const useGameEvents = () => {
    const { socket, currentUser } = useAuth();

    // Estados del juego
    const [jugadores, setJugadores] = useState<JugadorData[]>([]);
    const [gameStatus, setGameStatus] = useState<"loading" | "waiting" | "active">("loading");
    const [tablero, setTablero] = useState<TableroData | null>(null);

    // Crear servicio SOLO cuando haya socket
    const socketService = useMemo(() => {
        return socket ? new SocketService(socket) : null;
    }, [socket]);

    // ===============================
    // LISTENERS PRINCIPALES
    // ===============================
    useEffect(() => {
        if (!socketService) return;

        console.log("[useGameEvents] Configurando listeners...");

        const unsubPlayers = socketService.onPlayersUpdate((players) => {
            console.log("[useGameEvents] players_update recibido →", players.length);
            setJugadores(players);

            if (players.length > 0 && gameStatus === "loading") {
                setGameStatus("waiting");
            }
        });

        const unsubGameStart = socketService.onGameStarted((data) => {
            console.log("[useGameEvents] game_started recibido → Tablero inicial OK");

            setTablero(data.tablero);
            setGameStatus("active");
        });

        return () => {
            console.log("[useGameEvents] Limpiando listeners");
            unsubPlayers();
            unsubGameStart();
        };
    }, [socketService]);

    return {
        jugadores,
        gameStatus,
        tablero,

        // Acciones
        joinGame: socketService?.joinGame.bind(socketService),
        createGame: socketService?.createGame.bind(socketService),
        setReady: socketService?.setReady.bind(socketService),
        startGame: socketService?.startGame.bind(socketService),
        sendMove: socketService?.sendMove.bind(socketService),

        // Eventos adicionales
        onGameCreated: socketService?.onGameCreated.bind(socketService),
        onJoinedGame: socketService?.onJoinedGame.bind(socketService),
        onStartGame: socketService?.onStartGame.bind(socketService),
    };
};
