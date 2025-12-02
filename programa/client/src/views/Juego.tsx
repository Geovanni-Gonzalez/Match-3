// client/src/views/Juego.tsx
import React, { useEffect, useMemo } from "react";
import { useGameEvents } from "../hooks/useGameEvents";

interface JuegoProps {
  partidaId: string;
  currentUserNickname: string;
  onLeave: () => void;
}

export const Juego: React.FC<JuegoProps> = ({
  partidaId,
  currentUserNickname,
  onLeave
}) => {

  const {
    jugadores,
    tablero,
    gameStatus,
    error,
    selectCell,
    activateMatch,
  } = useGameEvents(partidaId);

  // ---- CALLBACKS ----
  const handleCellClick = (r: number, c: number) => {
    if (gameStatus !== "active") return;
    selectCell?.(partidaId, r, c);
  };

  const handleMatch = () => {
    activateMatch?.(partidaId);
  };

  // ---- RENDER ----
  if (error) {
    return (
      <div style={styles.windowFrame}>
        <h1 style={styles.title}>Error</h1>
        <p>{error}</p>
        <button onClick={onLeave} style={styles.leaveButton}>Volver</button>
      </div>
    );
  }

  if (!tablero) {
    return (
      <div style={styles.windowFrame}>
        <h1 style={styles.title}>Cargando partida...</h1>
      </div>
    );
  }

  return (
    <div style={styles.windowFrame}>
      <h1 style={styles.title}>Juego: {partidaId}</h1>

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
                const isPropia = celda.estado === "seleccion_propia";
                const isOtro = celda.estado === "seleccion_otro";
                const isLibre = celda.estado === "libre";

                return (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      ...styles.cell,
                      backgroundColor: celda.colorID,
                      border: isPropia
                        ? "3px solid #FFD700"
                        : isOtro
                        ? "3px solid #FF4500"
                        : "1px solid #333",
                      opacity: isOtro ? 0.7 : 1,
                      cursor: gameStatus === "active" ? "pointer" : "default"
                    }}
                    onClick={() => handleCellClick(r, c)}
                  />
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
  }
};
