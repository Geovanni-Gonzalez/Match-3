// programa/client/src/hooks/useGameEvents.ts
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { SocketService, JugadorData } from "../services/SocketService";

export interface TableroCell {
  r: number;
  c: number;
  colorID: string;
  estado: string;
  seleccionadoPor?: string | null;
}

export const useGameEvents = (partidaId: string, initialTablero?: TableroCell[][], initialConfig?: any) => {
  const { socket } = useAuth();
  const [jugadores, setJugadores] = useState<JugadorData[]>([]);
  const [gameStatus, setGameStatus] = useState<"loading" | "waiting" | "ready_to_start" | "active" | "errored" | "finished">(
    initialTablero ? "ready_to_start" : "loading"
  );
  const [tablero, setTablero] = useState<TableroCell[][] | null>(initialTablero || null);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [lobbyTimer, setLobbyTimer] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [matchesLeft, setMatchesLeft] = useState<number | null>(null);
  const [gameConfig, setGameConfig] = useState<any>(initialConfig || null);
  const [results, setResults] = useState<any[] | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<number>(6); // Default fallback
  const [notification, setNotification] = useState<{ message: string, type: 'error' | 'info' | 'success' } | null>(null);


  const service = useMemo(() => (socket ? new SocketService(socket) : null), [socket]);

  // Normaliza la matriz (por si viene flat)
  const normalizeMatrix = (matrix: any): TableroCell[][] => {
    if (!Array.isArray(matrix)) return [];

    if (Array.isArray(matrix[0])) return matrix as TableroCell[][];

    // flat → intentar chunk
    const maxR = Math.max(...matrix.map((c: TableroCell) => c.r));
    const maxC = Math.max(...matrix.map((c: TableroCell) => c.c));

    const newM: TableroCell[][] = [];
    for (let r = 0; r <= maxR; r++) {
      newM[r] = [];
      for (let c = 0; c <= maxC; c++) {
        newM[r][c] = matrix.find((x: TableroCell) => x.r === r && x.c === c)
          ?? { r, c, colorID: "#000", estado: "libre" };
      }
    }
    return newM;
  };

  useEffect(() => {
    if (!service || !partidaId) return;

    // players_update
    const unsubPlayers = service.onPlayersUpdate((players) => {
      setJugadores(players);
      if (players.length && gameStatus === "loading") {
        setGameStatus("waiting");
      }
    });

    // board_update
    const unsubBoard = service.onBoardUpdate((data) => {
      setTablero(normalizeMatrix(data.tablero));
    });



    // match_result
    const unsubMatch = service.onMatchResult((data) => {
      console.log("match_result:", data);
      if (data.valido === false) {
        setNotification({ message: "Match incorrecto", type: "error" });
        setTimeout(() => setNotification(null), 2000);
      } else if (data.valid === true) {
        // Opcional: mensaje de éxito
        // setNotification({ message: "¡Match correcto!", type: "success" });
        // setTimeout(() => setNotification(null), 1000);
      }
    });

    const unsubMatchInvalid = service.onMatchInvalid(({ reason }) => {
      setNotification({ message: `Match inválido: ${reason}`, type: "error" });
      setTimeout(() => setNotification(null), 3000);
    });

    const unsubCellBlocked = service.onCellBlocked(({ by }) => {
      setNotification({ message: "Celda bloqueada por otro jugador", type: "error" });
      setTimeout(() => setNotification(null), 2000);
    });

    // errores
    const unsubError = service.onError((e) => {
      console.error("socket error:", e);
      setError(e.message);
      setGameStatus("errored");
    });

    const unsubTimer = service.onTimerTick(({ secondsLeft, partidaId: pid, type }) => {
      if (pid && pid !== partidaId) return;

      if (type === 'game') {
        setTimer(secondsLeft);
      } else if (type === 'lobby') {
        setLobbyTimer(secondsLeft);
      }
    });

    const unsubCountdown = service.onGameCountdown(({ seconds }) => {
      setCountdown(seconds);
    });

    const unsubGameStarted = service.onGameStarted(({ tablero, config }) => {
      if (tablero) {
        setTablero(normalizeMatrix(tablero));
      }
      setGameConfig(config);
      setGameStatus("active");
      setCountdown(null); // Clear countdown
    });

    const unsubMatchUpdate = service.onMatchUpdate(({ matchesLeft }) => {
      setMatchesLeft(matchesLeft);
    });

    const unsubGameInfo = service.onGameInfo((info) => {
      if (info.maxJugadores) {
        setMaxPlayers(info.maxJugadores);
      }
    });

    const unsubGameFinished = service.onGameFinished(({ resultados }) => {
      // Handle finish (maybe redirect or show modal)
      console.log("Game Finished", resultados);
      setResults(resultados);
      setGameStatus("finished");
    });

    const unsubPartidaDeleted = service.onPartidaDeleted(({ partidaId: deletedId }) => {
      if (deletedId === partidaId) {
        setError("La partida ha sido cancelada por inactividad o falta de jugadores.");
        setGameStatus("errored");
      }
    });

    const unsubPlayerStatus = service.onPlayerStatusChanged(({ socketID, isReady }) => {
      setJugadores(prev => prev.map(j => 
        j.socketID === socketID ? { ...j, isReady } : j
      ));
    });

    const unsubForceNavigate = service.onForceNavigateGame(({ tablero, config }) => {
      setTablero(normalizeMatrix(tablero));
      setGameConfig(config);
      setGameStatus("ready_to_start");
    });

    // Request initial game info when mounting/connecting
    service.requestGameInfo(partidaId);

    return () => {
      unsubPlayers();
      unsubBoard();
      unsubMatch();
      unsubMatchInvalid();
      unsubCellBlocked();
      unsubError();
      unsubTimer();
      unsubCountdown();
      unsubGameStarted();
      unsubMatchUpdate();
      unsubGameFinished();
      unsubGameInfo();
      unsubPartidaDeleted();
      unsubPlayerStatus();
      unsubForceNavigate();
    };
  }, [service, partidaId, gameStatus]);

  // subscribe to room-level timer tick (useful for lobby if needed)
  // Removed redundant useEffect


  return {
    jugadores,
    gameStatus,
    tablero,
    error,
    timer,
    lobbyTimer,
    countdown,
    matchesLeft,
    gameConfig,
    results,
    maxPlayers,
    notification,

    // acciones expuestas
    joinGame: service?.joinGame.bind(service),
    leaveGame: service?.leaveGame.bind(service),
    setReady: (pid: string, ready: boolean) => service?.setReady(pid, ready),
    startGame: (pid: string) => service?.startGame(pid),
    selectCell: (pid: string, r: number, c: number) => service?.selectCell(pid, r, c),
    activateMatch: (pid: string) => service?.activateMatch(pid),
    rawSocket: () => service?.rawSocket(),
    onAllPlayersReady: service?.onAllPlayersReady.bind(service),
    requestEnterGame: (pid: string) => service?.requestEnterGame(pid),
    onForceNavigateGame: service?.onForceNavigateGame.bind(service),
  };
};
