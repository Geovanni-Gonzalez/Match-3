// client/src/views/LobbyPartidas.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { SocketService } from "../services/SocketService";

interface PartidaDisponible {
  id: string;
  tipo: "Match" | "Tiempo";
  jugadores: number;
  maxJugadores: number;
  tematica: string;
  tiempoRestante: string;
}

interface LobbyPartidasProps {
  onBack: () => void;
  onJoinSuccess: (partidaId: string) => void;
}

export const LobbyPartidas: React.FC<LobbyPartidasProps> = ({
  onBack,
  onJoinSuccess,
}) => {
  const { socket, currentUser } = useAuth();

  const [partidas, setPartidas] = useState<PartidaDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartidaId, setSelectedPartidaId] = useState<string | null>(null);

  const service = socket ? new SocketService(socket) : null;

  // ============================
  // 1) Cargar partidas por REST
  // ============================
  const fetchPartidas = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:4000/api/partidas");
      const data = await res.json();

      if (!res.ok) {
        setError("Error al cargar partidas del servidor.");
        return;
      }

      const parsed: PartidaDisponible[] = data.map((p: any) => ({
        id: p.id,
        tipo: p.tipo === "Vs" ? "Match" : "Tiempo",
        jugadores: p.jugadores,
        maxJugadores: p.maxJugadores ?? 2,
        tematica: p.tematica || "Clásico",
        tiempoRestante: p.tiempoRestante || "--:--",
      }));

      setPartidas(parsed);
    } catch (err) {
      setError("No se pudo conectar con el backend.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPartidas();
    const interval = setInterval(fetchPartidas, 4000);
    return () => clearInterval(interval);
  }, []);

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
    socket!.once("join_success", (data: { partidaId: string }) => {
      onJoinSuccess(data.partidaId);
    });

    socket!.once("join_error", (data: { message: string }) => {
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
                  <td style={styles.td}>{p.tiempoRestante}</td>
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
