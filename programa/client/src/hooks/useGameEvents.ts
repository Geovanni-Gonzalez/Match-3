// programa/client/src/hooks/useGameEvents.ts
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { SocketService, JugadorData } from "../services/SocketService";
import { on } from "events";

export interface TableroCell {
  r: number;
  c: number;
  colorID: string;
  estado: string;
}

export const useGameEvents = (partidaId: string) => {
  const { socket, currentUser } = useAuth();
  const [jugadores, setJugadores] = useState<JugadorData[]>([]);
  const [gameStatus, setGameStatus] = useState<"loading" | "waiting" | "active" | "errored">("loading");
  const [tablero, setTablero] = useState<TableroCell[][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(0);


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

    // game_started
    const unsubStarted = service.onGameStarted((data) => {
      setTablero(normalizeMatrix(data.tablero));
      setGameStatus("active");
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

    return () => {
      unsubPlayers();
      unsubBoard();
      unsubStarted();
      unsubMatch();
      unsubError();
      unsubTimer();
    };
  }, [service, partidaId]);

  return {
    jugadores,
    gameStatus,
    tablero,
    error,
    timer,

    // acciones expuestas
    joinGame: service?.joinGame.bind(service),
    createGame: service?.createGame.bind(service),
    leaveGame: service?.leaveGame.bind(service),
    setReady: (pid: string, ready: boolean) => service?.setReady(pid, ready),
    startGame: (pid: string) => service?.startGame(pid),
    selectCell: (pid: string, r: number, c: number) => service?.selectCell(pid, r, c),
    activateMatch: (pid: string) => service?.activateMatch(pid),
    rawSocket: () => service?.rawSocket(),
    onAllPlayersReady: service?.onAllPlayersReady.bind(service),
    onGameCreated: service?.onGameCreated.bind(service),
  };
};
