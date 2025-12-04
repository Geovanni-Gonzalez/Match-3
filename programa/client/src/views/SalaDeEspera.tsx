/**
 * @file SalaDeEspera.tsx
 * @description Vista de sala de espera (lobby) previa al inicio de la partida.
 * 
 * Permite:
 * - Ver la lista de jugadores que se han unido.
 * - Marcar al jugador actual como "listo".
 * - Si todos están listos, el host puede iniciar el juego presionando 'U'.
 * - Temporizador de espera que cancela la partida si no hay inicio en 3 minutos.
 */

import React, { useEffect, useState, useRef } from "react";
import { useGameEvents } from "../hooks/useGameEvents";
import { useAuth } from "../context/AuthContext";
import '../styles/SalaDeEspera.css';

interface Props {
  /** ID de la partida en la que se encuentra el jugador. */
  partidaId: string;
  /** Función para salir de la sala. */
  onLeave: () => void;
  /** Callback para navegar al juego cuando todos estén listos. */
  onStartGame: (partidaId: string, tablero: any, config: any) => void;
}

/**
 * Componente de sala de espera antes del inicio del juego.
 */
export const SalaDeEspera: React.FC<Props> = ({
  partidaId,
  onLeave,
  onStartGame
}) => {
  const { currentUser } = useAuth();

  const {
    jugadores,
    lobbyTimer,
    setReady,
    requestEnterGame,
    onAllPlayersReady,
    maxPlayers,
    onForceNavigateGame
  } = useGameEvents(partidaId);

  const [isReadyLocal, setIsReadyLocal] = useState(false);
  const [showTimeoutNotification, setShowTimeoutNotification] = useState(false);

  // ----------------------------
  // TIMER LOCAL (ANIMACIN)
  // ----------------------------
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Sincronizar estado local de "listo" con la informaci�n del servidor
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
        void unsub();
      }
    };
  }, [onAllPlayersReady]);

  // Cuando el servidor fuerza la navegaci�n al tablero
  useEffect(() => {
    if (!onForceNavigateGame) return;
    const unsub = onForceNavigateGame(({ tablero, config }) => {
      console.log("[SalaDeEspera] Navegando al tablero...");
      onStartGame(partidaId, tablero, config);
    });
    return () => { unsub(); };
  }, [onForceNavigateGame, onStartGame, partidaId]);

  const toggleReady = () => {
    const next = !isReadyLocal;
    // Optimistic update
    setIsReadyLocal(next);
    setReady?.(partidaId, next);
  };

  // Cuando recibimos tiempo del server  sincronizamos
  useEffect(() => {
    if (lobbyTimer <= 0) return;

    // Reiniciar loop local
    if (intervalRef.current) clearInterval(intervalRef.current);

    setTimeLeft(lobbyTimer);

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newVal = prev > 0 ? prev - 1 : 0;
        return newVal;
      });
    }, 1000);
  }, [lobbyTimer]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const allReady =
    jugadores.length >= 2 && jugadores.every((j) => j.isReady === true);

  // Identificar si el usuario actual es el host
  const isHost = jugadores.find(j => j.nickname === currentUser?.nickname)?.isHost;

  // Listener para tecla 'U' para iniciar juego (REQUERIMIENTO)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'u' || e.key === 'U') {
        if (allReady && isHost) {
          console.log('[SalaDeEspera] Tecla U presionada - Iniciando juego');
          requestEnterGame?.(partidaId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [allReady, isHost, partidaId, requestEnterGame]);

  return (
    <div className="sala-espera-container">
      {/* Notificación de timeout */}
      {showTimeoutNotification && (
        <div className="notification-overlay">
          <div className="notification-bubble">
            <div className="notification-icon">⏰</div>
            <div className="notification-content">
              <h3 className="notification-title">Partida Cancelada</h3>
              <p className="notification-message">
                La partida ha sido cancelada por inactividad (3 minutos sin iniciar)
              </p>
              <p className="notification-subtext">Redirigiendo al menú principal...</p>
            </div>
          </div>
        </div>
      )}

      {/* Fondo animado con gradiente */}
      <div className="sala-espera-background"></div>

      {/* Partículas flotantes */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="sala-espera-particle"
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
      <button className="back-button" onClick={onLeave}>
        ← Salir
      </button>

      {/* Card principal */}
      <div className="sala-espera-card">
        <h1 className="sala-espera-title">Sala de Espera</h1>

        {/* Indicador de tiempo restante */}
        <div className={`timeout-warning ${timeLeft > 120 ? 'green' :
          timeLeft > 60 ? 'orange' : 'red'
          }`}>
          ⏱️ Tiempo restante: {formatTime(timeLeft)}
          {timeLeft <= 60 && <span className="urgent-warning"> - ¡Apúrate!</span>}
        </div>

        <div className="info-bar">
          <span className="info-box">CÓDIGO: {partidaId.substring(0, 6).toUpperCase()}</span>
          <span className="info-box">Jugadores: {jugadores.length}/{maxPlayers}</span>
          {isHost && <span className="lider-badge">👑 LÍDER</span>}
        </div>

        <div className="players-list">
          {jugadores.map((jugador, index) => (
            <div
              key={jugador.socketID || index}
              className={`player-item ${jugador.nickname === currentUser?.nickname ? 'current-player' : ''
                } ${jugador.isReady ? 'ready-player' : ''
                }`}
            >
              <span>
                {index === 0 && '👑 '}{jugador.nickname} {jugador.nickname === currentUser?.nickname ? '(Tú)' : ''}
              </span>
              <span className="ready-status">
                {jugador.isReady ? '✅ LISTO' : '⏳ Esperando...'}
              </span>
            </div>
          ))}

          {Array(Math.max(0, maxPlayers - jugadores.length)).fill(0).map((_, index) => (
            <div key={`empty-${index}`} className="empty-player-item">Esperando jugador...</div>
          ))}
        </div>

        <button
          onClick={toggleReady}
          className={`ready-button ${isReadyLocal ? 'is-ready' : 'not-ready'}`}
        >
          {isReadyLocal ? '✅ YA ESTOY LISTO' : '⏳ MARCAR LISTO'}
        </button>

        {allReady && isHost && (
          <div className="start-section">
            <p className="start-message">¡Todos listos! Presiona 'U' o haz clic para iniciar.</p>
            <button
              onClick={() => requestEnterGame?.(partidaId)}
              className="start-button"
            >
              🚀 INICIAR JUEGO (U)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaDeEspera;