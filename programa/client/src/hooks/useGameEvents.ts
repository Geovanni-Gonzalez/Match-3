/**
 * @file useGameEvents.ts
 * @description Hook personalizado para gestionar la lógica de eventos del juego en el cliente.
 * 
 * Centraliza la suscripción a eventos de Socket.IO (actualización de tablero, jugadores, temporizadores, etc.)
 * y expone el estado reactivo y las acciones del juego a los componentes de vista.
 */

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { SocketService, JugadorData } from "../services/SocketService";
import { Celda } from "@match3/shared";

/**
 * Hook principal para la lógica de juego en tiempo real.
 * 
 * @param partidaId - ID de la partida a la que conectarse.
 * @param initialTablero - Estado inicial del tablero (opcional).
 * @param initialConfig - Configuración inicial del juego (opcional).
 * @returns Objeto con el estado del juego y funciones para interactuar.
 */
export const useGameEvents = (partidaId: string, initialTablero?: Celda[][], initialConfig?: any) => {
  const { socket } = useAuth();
  const [jugadores, setJugadores] = useState<JugadorData[]>([]);
  const [gameStatus, setGameStatus] = useState<"loading" | "waiting" | "ready_to_start" | "active" | "errored" | "finished">(
    initialTablero ? "ready_to_start" : "loading"
  );
  const [tablero, setTablero] = useState<Celda[][] | null>(initialTablero || null);
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

  /**
   * Normaliza la matriz del tablero recibida del servidor.
   * Si viene como array plano, lo convierte a matriz 2D.
   * @param matrix - Datos del tablero crudos.
   * @returns Matriz de celdas estructurada.
   */
  const normalizeMatrix = (matrix: any): Celda[][] => {
    if (!Array.isArray(matrix)) return [];

    if (Array.isArray(matrix[0])) return matrix as Celda[][];

    // flat → intentar chunk
    const maxR = Math.max(...matrix.map((c: Celda) => c.fila));
    const maxC = Math.max(...matrix.map((c: Celda) => c.columna));

    const newM: Celda[][] = [];
    for (let r = 0; r <= maxR; r++) {
      newM[r] = [];
      for (let c = 0; c <= maxC; c++) {
        newM[r][c] = matrix.find((x: Celda) => x.fila === r && x.columna === c)
          ?? { fila: r, columna: c, colorID: "#000", estado: "libre" };
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

    const unsubCellBlocked = service.onCellBlocked(({ by: _by }) => {
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

    const unsubHostLeft = service.onHostLeft(({ message }) => {
      setError(message);
      setGameStatus("errored");
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
      unsubHostLeft();
    };
  }, [service, partidaId, gameStatus]);

  // subscribe to room-level timer tick (useful for lobby if needed)
  // Removed redundant useEffect

  const actions = useMemo(() => ({
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
    onHostLeft: service?.onHostLeft.bind(service),
  }), [service]);

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
    ...actions
  };
};
