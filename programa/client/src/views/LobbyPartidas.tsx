/**
 * @file LobbyPartidas.tsx
 * @description Vista de listado de partidas disponibles (Lobby).
 * 
 * Muestra una tabla en tiempo real con las partidas creadas, permitiendo:
 * - Ver detalles (temática, jugadores, tiempo restante para inicio).
 * - Seleccionar una partida.
 * - Unirse a una partida existente.
 * 
 * Se suscribe a eventos de Socket.IO para mantener la lista actualizada.
 */

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { SocketService, PartidaListItem } from "../services/SocketService";
import { Loading } from "../components/Loading";
import '../styles/LobbyPartidas.css';

interface LobbyPartidasProps {
  /** Función para volver al menú principal. */
  onBack: () => void;
  /** Callback ejecutado al unirse exitosamente a una partida. */
  onJoinSuccess: (partidaId: string) => void;
}

/**
 * Componente de Lobby para listar y unirse a partidas.
 */
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

  /**
   * Formatea segundos a formato MM:SS.
   */
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
      setLoading(false);
    });

    // Escuchar actualizaciones del timer del lobby
    const unsubscribeTimer = service.onTimerTick((data) => {
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
  /**
   * Maneja la acción de unirse a la partida seleccionada.
   * Emite el evento 'join_game' y espera confirmación.
   */
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
    <div className="lobby-partidas-container">
      {/* Fondo animado con gradiente */}
      <div className="lobby-partidas-background"></div>

      {/* Partículas flotantes */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="lobby-partidas-particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${8 + Math.random() * 12}s`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}

      {/* Gemas decorativas */}
      <div className="gem gem-red" style={{ top: '8%', left: '10%', animationDelay: '0s' }}>💎</div>
      <div className="gem gem-blue" style={{ top: '15%', right: '12%', animationDelay: '1s' }}>💎</div>
      <div className="gem gem-green" style={{ bottom: '18%', left: '8%', animationDelay: '2s' }}>💎</div>
      <div className="gem gem-yellow" style={{ top: '45%', left: '5%', animationDelay: '1.5s' }}>💎</div>
      <div className="gem gem-purple" style={{ bottom: '25%', right: '10%', animationDelay: '2.5s' }}>💎</div>
      <div className="gem gem-orange" style={{ top: '60%', right: '7%', animationDelay: '0.8s' }}>💎</div>

      {/* Burbujas flotantes */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bubble"
          style={{
            left: `${10 + i * 12}%`,
            animationDuration: `${15 + Math.random() * 10}s`,
            animationDelay: `${i * 2}s`,
          }}
        />
      ))}

      {/* Botón de retroceso */}
      <button className="back-button" onClick={onBack}>
        ← Volver
      </button>

      {/* Card principal */}
      <div className="lobby-partidas-card">
        <h1 className="lobby-partidas-title">Partidas Disponibles</h1>

        <h3 className="lobby-subtitle">📋 Lista de partidas:</h3>

        {loading && <Loading fullScreen={false} message="Buscando partidas" />}
        {error && <p className="error-text">❌ Error: {error}</p>}

        {!loading && !error && partidas.length === 0 && (
          <p className="no-partidas-text">No hay partidas disponibles en este momento.</p>
        )}

        {!loading && !error && partidas.length > 0 && (
          <div className="table-wrapper">
            <table className="partidas-table">
              <thead>
                <tr>
                  <th className="table-header">Código</th>
                  <th className="table-header">Temática</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Jugadores</th>
                  <th className="table-header">Duración</th>
                  <th className="table-header">Cierre</th>
                </tr>
              </thead>
              <tbody>
                {partidas.map((partida) => {
                  const duracionTexto = partida.duracionMinutos ? `${partida.duracionMinutos} min` : 'N/A';
                  return (
                    <tr
                      key={partida.id}
                      className={`table-row ${selectedPartidaId === partida.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPartidaId(partida.id)}
                    >
                      <td className="table-cell" data-label="Código">#{partida.id.slice(0, 6)}</td>
                      <td className="table-cell" data-label="Temática">{partida.tematica}</td>
                      <td className="table-cell" data-label="Tipo">{partida.tipo}</td>
                      <td className="table-cell" data-label="Jugadores">
                        <div>{partida.jugadores}/{partida.maxJugadores}</div>
                        <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '4px' }}>
                          {partida.jugadoresNombres?.join(', ') || ''}
                        </div>
                      </td>
                      <td className="table-cell" data-label="Duración">{duracionTexto}</td>
                      <td className="table-cell" data-label="Cierre" style={{ color: partida.tiempoRestante < 60 ? '#ff4444' : 'inherit' }}>
                        {formatTime(partida.tiempoRestante)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={handleUnirseClick}
          disabled={!selectedPartidaId || loading}
          className="unirse-button"
        >
          🚀 Unirse a Partida
        </button>
      </div>
    </div>
  );
};

export default LobbyPartidas;