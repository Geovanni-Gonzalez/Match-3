// client/src/views/Juego.tsx
import React, { useEffect } from "react";
import { useGameEvents } from "../hooks/useGameEvents";
import { ResultadoPartida } from "./ResultadoPartida";

interface JuegoProps {
  partidaId: string;
  currentUserNickname: string;
  initialTablero?: any[][];
  initialConfig?: any;
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
  const handleCellClick = (r: number, c: number) => {
    if (gameStatus !== "active") return;
    selectCell?.(partidaId, r, c);
  };

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
      <div style={styles.windowFrame}>
        <h1 style={styles.title}>Error</h1>
        <p>{error}</p>
        <button onClick={onLeave} style={styles.leaveButton}>Volver</button>
      </div>
    );
  }

  if (!tablero || tablero.length === 0) {
    return (
      <div style={styles.windowFrame}>
        <h1 style={styles.title}>Cargando partida...</h1>
      </div>
    );
  }

  return (
    <div style={styles.windowFrame}>
      {notification && (
        <div style={{
          ...styles.notification,
          backgroundColor: notification.type === 'error' ? '#ff4444' : '#00C851',
        }}>
          {notification.message}
        </div>
      )}

      <h1 style={styles.title}>Juego: {partidaId}</h1>

      {/* Game Info Bar */}
      <div style={styles.infoBar}>
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
        <div style={styles.overlay}>
          <h1 style={styles.countdownText}>{countdown}</h1>
        </div>
      )}

      {/* Waiting for start Overlay */}
      {gameStatus === 'ready_to_start' && countdown === null && (
         <div style={styles.overlay}>
            <div style={{textAlign: 'center'}}>
              <h1 style={{color: 'white'}}>Partida Lista</h1>
              {isHost ? (
                 <p style={{color: '#61dafb', fontSize: '24px'}}>Presiona 'u' para iniciar</p>
              ) : (
                 <p style={{color: '#ccc', fontSize: '20px'}}>Esperando al anfitrión...</p>
              )}
            </div>
         </div>
      )}

      {/* Scoreboard */}
      <div style={styles.gameArea}>
        <div style={styles.scorePanel}>
          <table style={styles.scoreTable}>
            <thead>
              <tr>
                <th style={styles.scoreHeader}>Nombre</th>
                <th style={styles.scoreHeader}>Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {jugadores.map(j => (
                <tr
                  key={j.socketID}
                  style={j.nickname === currentUserNickname ? styles.currentUserRow : {}}
                >
                  <td style={styles.scoreCell}>{j.nickname}</td>
                  <td style={styles.scoreCell}>{j.puntaje ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tablero */}
        <div style={styles.boardContainer}>
          <div
            style={{
              ...styles.boardGrid,
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
                    style={{
                      ...styles.cell,
                      backgroundColor: '#282c34', // Fondo neutro para resaltar el icono
                      border: isPropia
                        ? "3px solid #FFD700"
                        : isOtro
                          ? "3px solid #FF4500"
                          : "1px solid #444",
                      opacity: isOtro ? 0.5 : 1,
                      cursor: gameStatus === "active" ? "pointer" : "default",
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '24px'
                    }}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {icon}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {gameStatus === "active" && (
        <button onClick={handleMatch} style={styles.matchButton}>
          Hacer Match
        </button>
      )}

      <button onClick={onLeave} style={styles.leaveButton}>
        Salir
      </button>
    </div>
  );
};

// ---- ESTILOS ----
const styles: { [key: string]: React.CSSProperties } = {
  windowFrame: {
    padding: "30px",
    borderRadius: "10px",
    backgroundColor: "#333744",
    boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "white",
    position: 'relative', // Needed for overlay
  },
  title: {
    fontSize: "24px",
    color: "#61dafb",
    marginBottom: "20px",
  },
  gameArea: {
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  scorePanel: {
    width: "200px",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#444857",
  },
  scoreTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  scoreHeader: {
    backgroundColor: "#61dafb",
    color: "#222",
    padding: "10px",
    textAlign: "left",
  },
  scoreCell: {
    padding: "8px 10px",
    textAlign: "left",
    borderBottom: "1px solid #555",
  },
  currentUserRow: {
    backgroundColor: "#3A404F",
    fontWeight: "bold",
  },
  boardContainer: {
    padding: "5px",
    borderRadius: "8px",
    backgroundColor: "#282c34",
  },
  boardGrid: {
    display: "grid",
    gap: "2px",
  },
  cell: {
    width: "35px",
    height: "35px",
    borderRadius: "4px",
    transition: "transform 0.1s, border 0.1s",
  },
  matchButton: {
    padding: "12px 30px",
    backgroundColor: "#00CED1",
    color: "#222",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  leaveButton: {
    marginTop: "10px",
    backgroundColor: "transparent",
    color: "#ccc",
    border: "none",
    cursor: "pointer",
  },
  infoBar: {
    display: 'flex',
    gap: '20px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: '10px',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderRadius: '10px',
  },
  countdownText: {
    fontSize: '80px',
    color: '#fff',
    fontWeight: 'bold',
  },
  notification: {
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    borderRadius: '5px',
    color: 'white',
    fontWeight: 'bold',
    zIndex: 200,
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
  }
};
