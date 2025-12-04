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

// Mapeo de temáticas a iconos/emojis
const THEME_ICONS: Record<string, Record<string, string>> = {
  'Gemas': {
    red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', purple: '🟣', orange: '🟠'
  },
  'Animales': {
    red: '🐞', blue: '🐳', green: '🐸', yellow: '🐝', purple: '🦄', orange: '🦊'
  },
  'Frutas': {
    red: '🍎', blue: '🫐', green: '🥝', yellow: '🍌', purple: '🍇', orange: '🍊'
  },
  'Monstruos': {
    red: '👹', blue: '👾', green: '🧟', yellow: '💀', purple: '👿', orange: '🎃'
  }
};

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
            animationDuration: `${5 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      <div className="juego-card">
        {notification && (
          <div className="notification" style={{
            backgroundColor: notification.type === 'error' ? '#ef4444' : '#10b981',
            borderColor: notification.type === 'error' ? '#dc2626' : '#059669',
          }}>
            {notification.message}
          </div>
        )}

        <h1 className="juego-title">Juego: {partidaId.substring(0, 6).toUpperCase()}</h1>

        {/* Game Info Bar */}
        <div className="info-bar">
          <span style={{ marginRight: '20px', color: '#fff' }}>Tema: {gameConfig?.tematica || 'Gemas'}</span>
          {gameConfig?.tipoJuego === 'Tiempo' && (
            <span>Tiempo: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
          )}
          {gameConfig?.tipoJuego === 'Match' && (
            <span>Matches Restantes: {matchesLeft ?? gameConfig?.limit}</span>
          )}
        </div>

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="overlay">
            <h1 className="countdown-number">{countdown}</h1>
          </div>
        )}

        {/* Waiting for start Overlay */}
        {gameStatus === 'ready_to_start' && countdown === null && (
           <div className="overlay">
              <div style={{textAlign: 'center'}}>
                <h1 className="waiting-title">Partida Lista</h1>
                {isHost ? (
                   <p style={{color: '#fbbf24', fontSize: '24px', fontWeight: 'bold'}}>Presiona 'U' para iniciar</p>
                ) : (
                   <p style={{color: '#c4b5fd', fontSize: '20px'}}>Esperando al anfitrión...</p>
                )}
              </div>
           </div>
        )}

        {/* Scoreboard */}
        <div className="game-area">
          <div className="score-panel">
            <table className="score-table">
              <thead>
                <tr>
                  <th className="score-header">Nombre</th>
                  <th className="score-header">Puntaje</th>
                </tr>
              </thead>
              <tbody>
                {jugadores.map(j => (
                  <tr
                    key={j.socketID}
                    className={j.nickname === currentUserNickname ? "current-user-row" : ""}
                  >
                    <td className="score-cell">{j.nickname}</td>
                    <td className="score-cell">{j.puntaje ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tablero */}
          <div className="board-container">
            <div
              className="board-grid"
              style={{
                gridTemplateRows: `repeat(${tablero.length}, 1fr)`,
                gridTemplateColumns: `repeat(${tablero[0].length}, 1fr)`
              }}
            >
              {tablero.map((row, r) =>
                row.map((celda, c) => {
                  const mySocketId = rawSocket?.()?.id;
                  const isPropia = celda.seleccionadoPor === mySocketId;
                  const isOtro = celda.seleccionadoPor && celda.seleccionadoPor !== mySocketId;

                  // Determinar icono según temática
                  const currentTheme = gameConfig?.tematica || 'Gemas';
                  const iconSet = THEME_ICONS[currentTheme] || THEME_ICONS['Gemas'];
                  const icon = iconSet[celda.colorID] || celda.colorID;

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`cell ${isPropia ? 'locked-by-me' : ''} ${isOtro ? 'locked-by-other' : ''}`}
                      style={{
                        backgroundColor: '#282c34', // Fondo neutro para resaltar el icono
                        cursor: gameStatus === "active" ? "pointer" : "default",
                        fontSize: '24px'
                      }}
                      onClick={() => handleCellClick(r, c)}
                    >
                      {icon}
                      {isOtro && <div className="lock-icon">🔒</div>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {gameStatus === "active" && (
          <button onClick={handleMatch} className="match-button">
            Hacer Match
          </button>
        )}

        <button onClick={onLeave} className="leave-button">
          Salir
        </button>
      </div>
    </div>
  );
};
