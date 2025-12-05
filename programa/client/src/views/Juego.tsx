/**
 * @file Juego.tsx
 * @description Vista principal del juego activo.
 * 
 * Renderiza:
 * - El tablero de juego (grid 9x7).
 * - La lista de jugadores y puntajes en tiempo real.
 * - Temporizadores y contadores de estado.
 * - Maneja la interacción del usuario (selección de celdas, activación de match).
 * - Muestra notificaciones y estados de transición (cuenta regresiva, fin de juego).
 */

import React, { useEffect } from "react";
import { useGameEvents } from "../hooks/useGameEvents";
import { ResultadoPartida } from "./ResultadoPartida";
import { TableroGrid } from "../components/TableroGrid";
import { ScoreBoard } from "../components/ScoreBoard";
import '../styles/Juego.css';

interface JuegoProps {
  /** ID de la partida actual. */
  partidaId: string;
  /** Nickname del usuario actual. */
  currentUserNickname: string;
  /** Estado inicial del tablero (opcional). */
  initialTablero?: any[][];
  /** Configuración inicial de la partida (opcional). */
  initialConfig?: any;
  /** Función para salir de la partida. */
  onLeave: () => void;
}

/**
 * Componente principal de la vista de juego.
 */
export const Juego: React.FC<JuegoProps> = ({
  partidaId,
  currentUserNickname,
  initialTablero,
  initialConfig,
  onLeave
}) => {

  const {
    jugadores,
    tablero,
    gameStatus,
    error,
    selectCell,
    activateMatch,
    startGame,
    countdown,
    matchesLeft,
    gameConfig,
    timer,
    results,
    rawSocket,
    notification
  } = useGameEvents(partidaId, initialTablero, initialConfig);

  const isHost = jugadores.find(j => j.nickname === currentUserNickname)?.isHost;

  // ---- CALLBACKS ----

  /**
   * Maneja el clic en una celda del tablero.
   * @param r - Fila.
   * @param c - Columna.
   */
  const handleCellClick = (r: number, c: number) => {
    if (gameStatus !== "active") return;
    selectCell?.(partidaId, r, c);
  };

  /**
   * Solicita al servidor validar el match con las celdas seleccionadas.
   */
  const handleMatch = () => {
    activateMatch?.(partidaId);
  };

  // Auto-match por inactividad (2 segundos)
  useEffect(() => {
    if (gameStatus !== "active" || !tablero) return;

    // Verificar si el usuario actual tiene celdas seleccionadas
    const mySocketId = rawSocket?.()?.id;
    const hasSelection = tablero.some(row =>
      row.some(cell => cell.seleccionadoPor === mySocketId)
    );

    if (!hasSelection) return;

    const timerId = setTimeout(() => {
      console.log("[Juego] Auto-match por inactividad");
      handleMatch();
    }, 2000); // Requerimiento: 2 segundos de inactividad

    return () => clearTimeout(timerId);
  }, [tablero, gameStatus, partidaId, rawSocket]); // Se reinicia cada vez que cambia el tablero (selección)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'u' && isHost && gameStatus === 'ready_to_start') {
        startGame?.(partidaId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame, partidaId, isHost, gameStatus]);

  // ---- RENDER ----
  if (gameStatus === "finished" && results) {
    // Mapear resultados al formato esperado por ResultadoPartida
    // Asumimos que results trae { nickname, puntaje, ... }
    const sortedResults = [...results].sort((a: any, b: any) => b.puntaje - a.puntaje);

    const formattedResults = sortedResults.map((r: any, index: number) => ({
      posicion: index + 1,
      nickname: r.nickname,
      puntaje: r.puntaje,
      isCurrentUser: r.nickname === currentUserNickname
    }));

    return (
      <ResultadoPartida
        partidaId={partidaId}
        resultados={formattedResults}
        onContinue={onLeave}
        tematica={gameConfig?.tematica}
      />
    );
  }

  if (error) {
    return (
      <div className="juego-container">
        <div className="juego-background"></div>
        <div className="juego-card">
          <h1 className="juego-title">Error</h1>
          <p className="error-message">{error}</p>
          <button onClick={onLeave} className="leave-button">Volver</button>
        </div>
      </div>
    );
  }

  if (!tablero || tablero.length === 0) {
    return (
      <div className="juego-container">
        <div className="juego-background"></div>
        <div className="juego-card">
          <h1 className="juego-title">Cargando partida...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="juego-container">
      <div className="juego-background"></div>

      {/* Partículas */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="juego-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${5 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      {/* HEADER AREA */}
      <header className="juego-header">
        <h1 className="juego-title">MATCH-3: {partidaId.substring(0, 6).toUpperCase()}</h1>

        <div className="info-bar">
          <span className="info-item">
            <span>🎨</span> {gameConfig?.tematica || 'Gemas'}
          </span>
          {gameConfig?.tipoJuego === 'Tiempo' && (
            <span className="info-item">
              <span>⏱️</span> {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </span>
          )}
          {gameConfig?.tipoJuego === 'Match' && (
            <span className="info-item">
              <span>🎯</span> {matchesLeft ?? gameConfig?.limit}
            </span>
          )}
        </div>
      </header>

      {/* LEFT PANEL: SCOREBOARD */}
      <div className="game-left-panel">
        <ScoreBoard
          jugadores={jugadores}
          currentUserNickname={currentUserNickname}
        />
      </div>

      {/* CENTER AREA: BOARD */}
      <div className="game-board-area">
        <TableroGrid
          tablero={tablero}
          onCellClick={handleCellClick}
          gameStatus={gameStatus}
          mySocketId={rawSocket?.()?.id}
          theme={gameConfig?.tematica}
        />
      </div>

      {/* RIGHT PANEL: ACTIONS */}
      <div className="game-right-panel">
        {gameStatus === "active" && (
          <button onClick={handleMatch} className="match-button">
            MATCH
          </button>
        )}

        <button onClick={onLeave} className="leave-button">
          Abandonar
        </button>
      </div>

      {/* NOTIFICATIONS & OVERLAYS */}
      {notification && (
        <div className="notification" style={{
          backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
          borderColor: notification.type === 'error' ? '#dc2626' : '#059669',
          color: 'white'
        }}>
          {notification.type === 'error' ? '⚠️' : '✅'} {notification.message}
        </div>
      )}

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="overlay">
          <h1 className="countdown-number">{countdown}</h1>
        </div>
      )}

      {/* Waiting for start Overlay */}
      {gameStatus === 'ready_to_start' && countdown === null && (
        <div className="overlay">
          <h1 className="waiting-title">Partida Lista</h1>
          {isHost ? (
            <div style={{ textAlign: 'center' }}>
              <p className="waiting-instruction">Presiona 'U' para iniciar</p>
              <p style={{ color: '#94a3b8', marginTop: '10px' }}>o espera a los demás jugadores</p>
            </div>
          ) : (
            <p className="waiting-instruction" style={{ borderColor: '#6366f1', color: '#818cf8' }}>
              Esperando al anfitrión...
            </p>
          )}
        </div>
      )}
    </div>
  );
};
