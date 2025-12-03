// client/src/views/SalaDeEspera.tsx
import React, { useEffect, useState, useRef } from "react";
import { useGameEvents } from "../hooks/useGameEvents";
import { useAuth } from "../context/AuthContext";

interface Props {
  partidaId: string;
  onLeave: () => void;
  onStartGame: (partidaId: string, tablero: any, config: any) => void;
}

export const SalaDeEspera: React.FC<Props> = ({
  partidaId,
  onLeave,
  onStartGame
}) => {
  const { currentUser } = useAuth();

  // 🔥 IMPORTANTE: El hook requiere el ID de la partida
  const {
    jugadores,
    gameStatus,
    tablero,
    timer,
    setReady,
    startGame,
    onAllPlayersReady,
    maxPlayers,
    countdown,
    gameConfig
  } = useGameEvents(partidaId);

  const [isReadyLocal, setIsReadyLocal] = useState(false);

  // ----------------------------
  // TIMER LOCAL (ANIMACIÓN)
  // ----------------------------
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar estado local de "listo" con la información del servidor
  useEffect(() => {
    const me = jugadores.find(j => j.nickname === currentUser?.nickname);
    if (me) {
      setIsReadyLocal(me.isReady);
    }
  }, [jugadores, currentUser]);

  // Log opcional para cuando el servidor dice "todos listos"
  useEffect(() => {
    if (!onAllPlayersReady) return;
    const unsub = onAllPlayersReady((d) => {
      console.log("Servidor confirma: todos listos en", d.partidaId);
    });
    return () => {
      if (typeof unsub === "function") {
        // Llamar y descartar cualquier valor de retorno para asegurar que el destructor devuelva void
        void unsub();
      }
    };
  }, [onAllPlayersReady]);

  // Cuando el hook indica que la partida ya inició
  useEffect(() => {
    if (gameStatus === "active") {
      console.log("[SalaDeEspera] gameStatus = active → navegar al juego");
      onStartGame(partidaId, tablero, gameConfig);
    }
  }, [gameStatus, tablero, partidaId, onStartGame, gameConfig]);

  const toggleReady = () => {
    const next = !isReadyLocal;
    // Optimistic update
    setIsReadyLocal(next);
    setReady?.(partidaId, next);
  };

  // Cuando recibimos tiempo del server → sincronizamos
  useEffect(() => {
    if (timer <= 0) return;

    // Reiniciar loop local
    if (intervalRef.current) clearInterval(intervalRef.current);

    setTimeLeft(timer);

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newVal = prev > 0 ? prev - 1 : 0;
        return newVal;
      });
    }, 1000);
  }, [timer]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStart = () => {
    startGame?.(partidaId);
  };

  const allReady =
    jugadores.length >= 2 && jugadores.every((j) => j.isReady === true);

  // Identificar si el usuario actual es el host
  const isHost = jugadores.find(j => j.nickname === currentUser?.nickname)?.isHost;

  return (
    <div style={styles.windowFrame}>
      {/* Countdown Overlay */}
      {countdown !== null && (
        <div style={styles.overlay}>
          <h1 style={styles.countdownText}>Iniciando en {countdown}...</h1>
        </div>
      )}

      <div style={styles.backButton} onClick={onLeave}>
        ←
      </div>

      <h1 style={styles.title}>Sala de Espera</h1>

      <div style={styles.timerBox}>
        <div>⏳ Tiempo para iniciar:</div>
        <strong style={{ fontSize: 32, color: "#61dafb" }}>
          {timeLeft}s
        </strong>
      </div>

      <div style={styles.infoBar}>
        <span style={styles.infoBox}>
          CÓDIGO: {partidaId.substring(0, 6).toUpperCase()}
        </span>
        <span style={styles.infoBox}>
          Jugadores: {jugadores.length}/{maxPlayers}
        </span>
      </div>

      {/* Lista de jugadores */}
      <div style={styles.playersList}>
        {jugadores.map((j) => (
          <div
            key={j.socketID}
            style={{
              ...styles.playerItem,
              ...(currentUser?.nickname === j.nickname
                ? styles.currentPlayer
                : {}),
              ...(j.isReady ? styles.readyPlayer : {})
            }}
          >
            {j.nickname}
            {currentUser?.nickname === j.nickname ? " (Tú)" : ""}
            {j.isHost && <span style={{ marginLeft: "5px", color: "#FFD700" }}>👑</span>}
            <span style={styles.readyStatus}>
              {j.isReady ? "✅ LISTO" : "⏳ Esperando"}
            </span>
          </div>
        ))}

        {Array(Math.max(0, maxPlayers - jugadores.length))
          .fill(0)
          .map((_, i) => (
            <div key={`empty-${i}`} style={styles.emptyPlayerItem}>
              Esperando jugador...
            </div>
          ))}
      </div>

      {/* Botón listo/no listo */}
      <button
        onClick={toggleReady}
        style={{
          ...styles.readyButton,
          backgroundColor: isReadyLocal ? "#4CAF50" : "#FF9800"
        }}
      >
        {isReadyLocal ? "YA ESTOY LISTO" : "MARCAR LISTO"}
      </button>

      {/* Mostrar botón de iniciar si todos están listos */}
      {allReady && (
        <div style={{ marginTop: 20 }}>
          <p style={styles.startMessage}>
            ¡Todos listos! La partida puede comenzar.
          </p>
          {isHost ? (
            <button onClick={handleStart} style={styles.startButton}>
              INICIAR JUEGO (HOST)
            </button>
          ) : (
            <p style={{ color: "#ccc", fontStyle: "italic" }}>
              Esperando a que el anfitrión inicie la partida...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  windowFrame: {
    padding: "30px",
    borderRadius: "10px",
    backgroundColor: "#333744",
    width: "450px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
    position: "relative",
    color: "white"
  },
  backButton: {
    position: "absolute",
    top: "15px",
    left: "15px",
    fontSize: "24px",
    cursor: "pointer",
    color: "#FF6347"
  },
  title: {
    fontSize: "32px",
    color: "#61dafb",
    textAlign: "center"
  },
  infoBar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    marginBottom: "20px"
  },
  infoBox: {
    backgroundColor: "#444857",
    padding: "8px 15px",
    borderRadius: "5px",
    fontWeight: "bold"
  },
  playersList: {
    width: "100%",
    maxHeight: "240px",
    overflowY: "auto"
  },
  playerItem: {
    padding: "12px",
    margin: "8px 0",
    borderRadius: "8px",
    backgroundColor: "#444857",
    borderLeft: "5px solid #FF9800",
    display: "flex",
    justifyContent: "space-between"
  },
  currentPlayer: {
    backgroundColor: "#2196F3",
    borderLeft: "5px solid #1565C0"
  },
  readyPlayer: {
    borderLeft: "5px solid #4CAF50"
  },
  readyStatus: {
    fontSize: "12px"
  },
  emptyPlayerItem: {
    padding: "12px",
    margin: "8px 0",
    textAlign: "center",
    borderRadius: "8px",
    backgroundColor: "#555866"
  },
  readyButton: {
    padding: "14px 24px",
    fontSize: "18px",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    border: "none",
    marginTop: "10px"
  },
  startButton: {
    padding: "14px 24px",
    backgroundColor: "#61dafb",
    borderRadius: "8px",
    color: "#282c34",
    cursor: "pointer",
    border: "none"
  },
  startMessage: {
    textAlign: "center",
    color: "#4CAF50",
    marginBottom: "10px",
    fontWeight: "bold"
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderRadius: '10px',
  },
  countdownText: {
    fontSize: '60px',
    color: '#61dafb',
    fontWeight: 'bold',
  }
};
