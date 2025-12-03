// programa/client/src/hooks/useGameEvents.ts
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { SocketService, JugadorData } from "../services/SocketService";

export interface TableroCell {
  r: number;
  c: number;
  colorID: string;
  estado: string;
}

export const useGameEvents = (partidaId: string, initialTablero?: TableroCell[][]) => {
  const { socket } = useAuth();
  const [jugadores, setJugadores] = useState<JugadorData[]>([]);
  const [gameStatus, setGameStatus] = useState<"loading" | "waiting" | "active" | "errored" | "finished">("loading");
  const [tablero, setTablero] = useState<TableroCell[][] | null>(initialTablero || null);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [matchesLeft, setMatchesLeft] = useState<number | null>(null);
  const [gameConfig, setGameConfig] = useState<any>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<number>(6); // Default fallback


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
    });

    // errores
    const unsubError = service.onError((e) => {
      console.error("socket error:", e);
      setError(e.message);
      setGameStatus("errored");
    });

    const unsubTimer = service.onTimerTick(({ secondsLeft }) => {
      setTimer(secondsLeft);
    });

    const unsubCountdown = service.onGameCountdown(({ seconds }) => {
      setCountdown(seconds);
    });

    const unsubGameStarted = service.onGameStarted(({ tablero, config }) => {
      setTablero(normalizeMatrix(tablero));
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

    // Request initial game info when mounting/connecting
    service.requestGameInfo(partidaId);

    return () => {
      unsubPlayers();
      unsubBoard();
      unsubMatch();
      unsubError();
      unsubTimer();
      unsubCountdown();
      unsubGameStarted();
      unsubMatchUpdate();
      unsubGameFinished();
      unsubGameInfo();
      unsubPartidaDeleted();
    };
  }, [service, partidaId, gameStatus]);

  // subscribe to room-level timer tick (useful for lobby if needed)
  useEffect(() => {
    if (!service || !partidaId) return;
    const unsub = service.onTimerTick((data) => {
      if (data.partidaId === partidaId) {
        setTimer(data.secondsLeft);
      }
    });
    return () => { unsub(); };
  }, [service, partidaId]);

  return {
    jugadores,
    gameStatus,
    tablero,
    error,
    timer,
    countdown,
    matchesLeft,
    gameConfig,
    results,
    maxPlayers,

    // acciones expuestas
    joinGame: service?.joinGame.bind(service),
    leaveGame: service?.leaveGame.bind(service),
    setReady: (pid: string, ready: boolean) => service?.setReady(pid, ready),
    startGame: (pid: string) => service?.startGame(pid),
    selectCell: (pid: string, r: number, c: number) => service?.selectCell(pid, r, c),
    activateMatch: (pid: string) => service?.activateMatch(pid),
    rawSocket: () => service?.rawSocket(),
    onAllPlayersReady: service?.onAllPlayersReady.bind(service),
  };
};
