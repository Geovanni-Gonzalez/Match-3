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

import React, { useEffect, useCallback } from "react";
import { useGameEvents } from "../hooks/useGameEvents";
import { ResultadoPartida } from "./ResultadoPartida";
import { TableroGrid } from "../components/TableroGrid";
import { ScoreBoard } from "../components/ScoreBoard";
import { Loading } from "../components/Loading";
import '../styles/Juego.css';
import { Celda } from "@match3/shared";

interface JuegoProps {
  /** ID de la partida actual. */
  partidaId: string;
  /** Nickname del usuario actual. */
  currentUserNickname: string;
  /** Estado inicial del tablero (opcional). */
  initialTablero?: Celda[][];
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

  // Contar celdas seleccionadas por el usuario actual
  const mySocketId = rawSocket?.()?.id;
  const selectedCellsCount = tablero?.reduce((count, row) =>
    count + row.filter(cell => cell.seleccionadoPor === mySocketId).length, 0
  ) ?? 0;

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
  const handleMatch = useCallback(() => {
    activateMatch?.(partidaId);
  }, [activateMatch, partidaId]);

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
  }, [tablero, gameStatus, partidaId, rawSocket, handleMatch]); // Se reinicia cada vez que cambia el tablero (selección)

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
    return <Loading message="Sincronizando tablero" />;
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
          <span className="info-item">
            <span>🏆</span> {jugadores.find(j => j.nickname === currentUserNickname)?.puntaje || 0}
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
      <div className="game-right-panel" role="complementary" aria-label="Controles del juego">
        {gameStatus === "active" && (
          <div className="match-button-container">
            <button
              onClick={handleMatch}
              className="match-button"
              aria-label="Activar match con celdas seleccionadas"
              title="Presiona para validar tu selección"
              disabled={selectedCellsCount < 3}
            >
              <span className="match-text">MATCH</span>
              {selectedCellsCount > 0 && (
                <span className="selection-counter" aria-live="polite">
                  {selectedCellsCount}
                </span>
              )}
            </button>
            {selectedCellsCount > 0 && selectedCellsCount < 3 && (
              <span className="selection-hint">Selecciona al menos 3</span>
            )}
          </div>
        )}

        <button
          onClick={onLeave}
          className="leave-button"
          aria-label="Abandonar partida"
          title="Salir de la partida actual"
        >
          🚪 Abandonar
        </button>
      </div>

      {/* NOTIFICATIONS & OVERLAYS */}
      {notification && (
        <div
          className={`notification notification-${notification.type}`}
          role="alert"
          aria-live="assertive"
        >
          <span className="notification-icon">
            {notification.type === 'error' ? '⚠️' : notification.type === 'success' ? '✅' : 'ℹ️'}
          </span>
          <span className="notification-message">{notification.message}</span>
        </div>
      )}

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="overlay" role="dialog" aria-label="Cuenta regresiva">
          <h1 className="countdown-number" aria-live="polite">{countdown}</h1>
          <p className="countdown-subtitle">¡Prepárate!</p>
        </div>
      )}

      {/* Waiting for start Overlay */}
      {gameStatus === 'ready_to_start' && countdown === null && (
        <div className="overlay" role="dialog" aria-label="Esperando inicio">
          <h1 className="waiting-title">🎮 Partida Lista</h1>
          {isHost ? (
            <div style={{ textAlign: 'center' }}>
              <p className="waiting-instruction" role="status">
                <kbd className="key-badge">U</kbd> Presiona para iniciar
              </p>
              <p className="waiting-subtitle">o espera a los demás jugadores</p>
            </div>
          ) : (
            <p className="waiting-instruction non-host" role="status">
              ⏳ Esperando al anfitrión...
            </p>
          )}
        </div>
      )}
    </div>
  );
};
