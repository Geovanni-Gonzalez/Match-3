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
import { Logger } from "../utils/Logger";
import { Background } from "../components/Background";

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
        Logger.info("[LobbyPartidas] joined_game received, navigating...");
        onJoinSuccess(data.idPartida);
      }
    );

    socket!.once("error_join", (data: { message: string }) => {
      Logger.error("No se pudo entrar: " + data.message);
      alert("No se pudo entrar: " + data.message);
    });
  };

  // ============================
  // Render
  // ============================
  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center overflow-hidden p-5">
      <Background />

      {/* Botón de retroceso */}
      <button
        className="absolute top-5 left-5 flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-xl text-lg font-bold shadow-md hover:-translate-x-1 hover:shadow-lg hover:shadow-red-600/50 active:translate-x-0 transition-all duration-300 z-20"
        onClick={onBack}
      >
        <span>← Volver</span>
      </button>

      {/* Card principal */}
      <div className="relative w-[750px] max-w-[92vw] max-h-[90vh] p-[50px_45px] rounded-[35px] bg-slate-900/85 backdrop-blur-xl border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.6)] overflow-y-auto animate-[cardEntrance_0.8s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">

        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-400 via-indigo-400 to-purple-400 uppercase tracking-widest drop-shadow-sm text-center mb-9">
          Partidas Disponibles
        </h1>

        <h3 className="text-xl font-bold text-violet-300 uppercase tracking-wider mb-5 flex items-center gap-2">
          <span>📋</span> Lista de partidas:
        </h3>

        {loading && <Loading fullScreen={false} message="Buscando partidas" />}

        {error && (
          <div className="text-red-400 text-center font-bold text-lg p-4 bg-red-900/30 border-2 border-red-500 rounded-2xl shadow-lg my-8">
            ❌ Error: {error}
          </div>
        )}

        {!loading && !error && partidas.length === 0 && (
          <p className="text-slate-400 text-lg font-semibold italic text-center my-10 bg-black/20 p-8 rounded-2xl">
            No hay partidas disponibles en este momento.
          </p>
        )}

        {!loading && !error && partidas.length > 0 && (
          <div className="w-full max-h-[400px] overflow-y-auto overflow-x-hidden mb-6 rounded-2xl bg-indigo-900/30 border-2 border-indigo-900 shadow-inner scrollbar-thin scrollbar-thumb-violet-600 scrollbar-track-transparent">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md">
                  <th className="p-4 text-left font-extrabold uppercase text-sm border-b-4 border-emerald-500">Código</th>
                  <th className="p-4 text-left font-extrabold uppercase text-sm border-b-4 border-emerald-500">Temática</th>
                  <th className="p-4 text-left font-extrabold uppercase text-sm border-b-4 border-emerald-500">Tipo</th>
                  <th className="p-4 text-left font-extrabold uppercase text-sm border-b-4 border-emerald-500">Jugadores</th>
                  <th className="p-4 text-left font-extrabold uppercase text-sm border-b-4 border-emerald-500">Duración</th>
                  <th className="p-4 text-left font-extrabold uppercase text-sm border-b-4 border-emerald-500">Cierre</th>
                </tr>
              </thead>
              <tbody>
                {partidas.map((partida) => {
                  const duracionTexto = partida.duracionMinutos ? `${partida.duracionMinutos} min` : 'N/A';
                  const isSelected = selectedPartidaId === partida.id;

                  return (
                    <tr
                      key={partida.id}
                      onClick={() => setSelectedPartidaId(partida.id)}
                      className={`
                        cursor-pointer transition-all duration-200 border-b border-white/5
                        ${isSelected
                          ? 'bg-gradient-to-r from-blue-800 to-blue-900 shadow-[inset_0_0_20px_rgba(59,130,246,0.3)] border-l-4 border-l-blue-400 scale-[1.01]'
                          : 'bg-indigo-900/40 hover:bg-violet-800/40 hover:scale-[1.01] hover:shadow-lg'
                        }
                      `}
                    >
                      <td className={`p-4 font-bold text-sm tracking-wider ${isSelected ? 'text-blue-200' : 'text-violet-300'}`}>
                        #{partida.id.slice(0, 6)}
                      </td>
                      <td className="p-4 text-slate-200 font-semibold text-sm">{partida.tematica}</td>
                      <td className="p-4 text-slate-200 font-semibold text-sm">{partida.tipo}</td>
                      <td className="p-4">
                        <div className="text-slate-200 font-bold">{partida.jugadores}/{partida.maxJugadores}</div>
                        <div className="text-[11px] text-violet-400 mt-1 truncate max-w-[100px]">
                          {partida.jugadoresNombres?.join(', ') || ''}
                        </div>
                      </td>
                      <td className="p-4 text-slate-200 font-semibold text-sm">{duracionTexto}</td>
                      <td className={`p-4 font-bold font-mono text-sm ${partida.tiempoRestante < 60 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
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
          className={`
            w-full p-5 mt-3 rounded-2xl text-xl font-extrabold uppercase tracking-widest text-white shadow-xl transition-all duration-300
            flex items-center justify-center gap-3 relative overflow-hidden group
            ${!selectedPartidaId || loading
              ? 'bg-slate-700 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:-translate-y-1 hover:shadow-emerald-500/40'
            }
          `}
        >
          {/* Shine effect */}
          {selectedPartidaId && !loading && (
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700 group-hover:left-full"></div>
          )}
          <span>🚀 Unirse a Partida</span>
        </button>
      </div>
    </div>
  );
};

export default LobbyPartidas;