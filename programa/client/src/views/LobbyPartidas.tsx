// client/src/views/LobbyPartidas.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { SocketService, PartidaListItem } from "../services/SocketService";

interface LobbyPartidasProps {
  onBack: () => void;
  onJoinSuccess: (partidaId: string) => void;
}

export const LobbyPartidas: React.FC<LobbyPartidasProps> = ({
  onBack,
  onJoinSuccess,
}) => {
  const { socket, currentUser } = useAuth();

  const [partidas, setPartidas] = useState<PartidaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartidaId, setSelectedPartidaId] = useState<string | null>(
    null
  );

  const service = useMemo(() => (socket ? new SocketService(socket) : null), [socket]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ============================
  // 1) Cargar y actualizar partidas por WebSocket
  // ============================
  useEffect(() => {
    if (!service) {
      setError("La conexión no está disponible.");
      setLoading(false);
      return;
    }

    setLoading(true);

    // Pedir la lista inicial
    service.getPartidas();

    // Escuchar actualizaciones
    const unsubscribe = service.onPartidasList((lista) => {
      setPartidas(lista);
      if (loading) setLoading(false);
    });

    // Escuchar actualizaciones del timer del lobby
    const unsubscribeTimer = service.onTimerTick((data) => {
      // Si el evento viene con partidaId, actualizamos solo esa partida en la lista local
      if (data.partidaId) {
        setPartidas(prevPartidas => 
          prevPartidas.map(p => 
            p.id === data.partidaId 
              ? { ...p, tiempoRestante: data.secondsLeft } 
              : p
          )
        );
      }
    });

    // Limpiar suscripción al desmontar
    return () => {
      unsubscribe();
      unsubscribeTimer();
    };
  }, [service]);

  // ============================
  // 2) Unirse a partida por Socket.IO
  // ============================
  const handleUnirseClick = () => {
    if (!service) {
      alert("No hay conexión con el servidor.");
      return;
    }
    if (!currentUser) {
      alert("Necesitas iniciar sesión.");
      return;
    }
    if (!selectedPartidaId) {
      alert("Selecciona una partida.");
      return;
    }

    // Enviar join al backend
    service.joinGame(selectedPartidaId, currentUser.nickname, currentUser.idDB);

    // Esperar confirmación
    socket!.once(
      "joined_game",
      (data: { idPartida: string; nickname: string; socketID: string }) => {
        console.log("[LobbyPartidas] joined_game received, navigating...");
        onJoinSuccess(data.idPartida);
      }
    );

    socket!.once("error_join", (data: { message: string }) => {
      alert("No se pudo entrar: " + data.message);
    });
  };

  // ============================
  // Render
  // ============================
  return (
    <div style={styles.windowFrame}>
      <div style={styles.backButton} onClick={onBack}>
        ←
      </div>

      <h1 style={styles.title}>Partidas disponibles</h1>

      {loading && <p style={styles.loading}>Cargando partidas...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {!loading && partidas.length === 0 && (
        <p style={styles.noData}>No hay partidas disponibles.</p>
      )}

      {!loading && partidas.length > 0 && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Temática</th>
                <th style={styles.th}>Jugadores</th>
                <th style={styles.th}>Tiempo</th>
              </tr>
            </thead>
            <tbody>
              {partidas.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPartidaId(p.id)}
                  style={
                    selectedPartidaId === p.id
                      ? styles.rowSelected
                      : styles.row
                  }
                >
                  <td style={styles.td}>{p.id}</td>
                  <td style={styles.td}>{p.tipo}</td>
                  <td style={styles.td}>{p.tematica}</td>
                  <td style={styles.td}>
                    {p.jugadores}/{p.maxJugadores}
                  </td>
                  <td style={styles.td}>{formatTime(p.tiempoRestante)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        style={styles.joinBtn}
        onClick={handleUnirseClick}
        disabled={!selectedPartidaId}
      >
        Unirse
      </button>
    </div>
  );
};

// ============================
// ESTILOS
// ============================
const styles: { [key: string]: React.CSSProperties } = {
  windowFrame: {
    padding: "20px",
    borderRadius: "10px",
    backgroundColor: "#333744",
    width: "640px",
    position: "relative",
    color: "white",
  },
  backButton: {
    position: "absolute",
    top: "12px",
    left: "12px",
    fontSize: "22px",
    cursor: "pointer",
    color: "#61dafb",
  },
  title: {
    textAlign: "center",
    color: "#61dafb",
    marginBottom: "20px",
  },
  loading: { color: "#61dafb", textAlign: "center" },
  error: { color: "tomato", textAlign: "center" },
  noData: { color: "#ccc", textAlign: "center" },
  tableWrapper: {
    maxHeight: "300px",
    overflowY: "auto",
    marginBottom: "20px",
    border: "1px solid #555",
    borderRadius: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    color: "white",
  },
  th: {
    backgroundColor: "#4CAF50",
    padding: "10px",
    textAlign: "left",
    position: "sticky",
    top: 0,
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #444",
  },
  row: {
    cursor: "pointer",
  },
  rowSelected: {
    cursor: "pointer",
    backgroundColor: "#505469",
  },
  joinBtn: {
    padding: "12px 30px",
    fontSize: "18px",
    backgroundColor: "#4CAF50",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    display: "block",
    margin: "auto",
  },
};
