// client/src/views/SalaDeEspera.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './SalaDeEspera.css'; 

interface JugadorSala {
  nickname: string;
  socketID: string;
  isReady: boolean;
}

interface SalaDeEsperaProps {
  partidaId: string;
  currentUserNickname: string;
  onLeave: () => void;
  onStartGame: (partidaId: string, tablero: any[], jugadores: any[], gameInfo: any) => void;
}

export const SalaDeEspera: React.FC<SalaDeEsperaProps> = ({ 
  partidaId, 
  currentUserNickname,
  onLeave, 
  onStartGame 
}) => {
  const { socket } = useAuth(); 
  const [jugadores, setJugadores] = useState<JugadorSala[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [esLider, setEsLider] = useState(false);
  const [maxJugadores, setMaxJugadores] = useState<number>(6);
  const [infoPartida, setInfoPartida] = useState<any>(null); // Guardar info completa
  const [tiempoRestante, setTiempoRestante] = useState<number>(180); // 3 minutos en segundos
  const [showTimeoutNotification, setShowTimeoutNotification] = useState(false);

  useEffect(() => {
    // Obtener info de la partida
    const fetchPartidaInfo = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
        const response = await fetch(`${backendUrl}/api/partidas/${partidaId}`);
        const data = await response.json();
        
        if (data.success) {
          setMaxJugadores(data.partida.numJugadoresMax);
          setInfoPartida(data.partida); // Guardar toda la info
        }
      } catch (error) {
        console.error('[SalaDeEspera] Error al obtener info de partida:', error);
      }
    };
    
    fetchPartidaInfo();
  }, [partidaId]);

  useEffect(() => {
    if (!socket) return;

    console.log(`[Client] Uniéndose a sala: ${partidaId}`);
    socket.emit('join_room', { partidaId, nickname: currentUserNickname });

    socket.on('update_players_list', (listaServidor: JugadorSala[]) => {
        setJugadores(listaServidor);
        // El primer jugador de la lista es el líder
        if (listaServidor.length > 0 && listaServidor[0].nickname === currentUserNickname) {
            setEsLider(true);
        }
    });

    socket.on('player_status_changed', (data) => {
        setJugadores(prev => prev.map(p => 
            p.socketID === data.socketID ? { ...p, isReady: data.isReady } : p
        ));
    });

    // --- CORRECCIÓN AQUÍ: Recibimos y pasamos 'jugadores' ---
    socket.on('game_started', (data: { tablero: any[], jugadores: any[], tipoJuego: string, tematica: string, duracionMinutos?: number }) => {
        console.log('[Client] Partida iniciada. Datos recibidos:', data);
        // Pasamos los argumentos con la info del juego
        onStartGame(partidaId, data.tablero, data.jugadores, {
            tipoJuego: data.tipoJuego,
            tematica: data.tematica,
            duracionMinutos: data.duracionMinutos
        }); 
    });

    // Manejar timeout de partida (3 minutos sin iniciar)
    socket.on('game_timeout', (data: { mensaje: string }) => {
        console.log('[Client] Partida cancelada por timeout:', data.mensaje);
        setShowTimeoutNotification(true);
        
        // Esperar 3 segundos para que el usuario lea el mensaje antes de regresar
        setTimeout(() => {
            onLeave();
        }, 3000);
    });

    return () => {
        socket.off('update_players_list');
        socket.off('player_status_changed');
        socket.off('game_started');
        socket.off('game_timeout');
    };
  }, [socket, partidaId, currentUserNickname, onStartGame, onLeave]);

  // Cronómetro de tiempo restante
  useEffect(() => {
    const timer = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleToggleReady = () => {
    if (!socket) return;
    const newState = !isReady;
    setIsReady(newState); 
    socket.emit('player_ready', { partidaId, isReady: newState });
  };

  const handleEmitStartGame = () => {
      if (!socket || !infoPartida) return;
      console.log('[Client] Solicitando iniciar partida...');
      
      // Enviar info real de la partida
      socket.emit('start_game', { 
        partidaId,
        tipoJuego: infoPartida.tipoJuego || 'Match',
        tematica: infoPartida.tematica || 'Gemas',
        duracion: infoPartida.duracionMinutos
      });
  };

  const handleLeaveRoom = () => {
    if (!socket) return;
    console.log('[Client] Abandonando sala de espera...');
    
    // Notificar al servidor que el jugador abandona la sala
    socket.emit('leave_waiting_room', { partidaId, nickname: currentUserNickname });
    
    // Ejecutar callback para regresar al menú
    onLeave();
  };

  const allPlayersReady = jugadores.length >= 2 && jugadores.every(j => j.isReady);
  const puedeIniciar = esLider && allPlayersReady; // Solo el líder puede iniciar cuando todos estén listos

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (tiempoRestante > 120) return '#4CAF50'; // Verde
    if (tiempoRestante > 60) return '#FF9800'; // Naranja
    return '#FF4444'; // Rojo
  };

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
      <button className="back-button" onClick={handleLeaveRoom}>
        ← Salir
      </button>

      {/* Card principal */}
      <div className="sala-espera-card">
        <h1 className="sala-espera-title">Sala de Espera</h1>

        {/* Indicador de tiempo restante */}
        <div className={`timeout-warning ${
          tiempoRestante > 120 ? 'green' : 
          tiempoRestante > 60 ? 'orange' : 'red'
        }`}>
          ⏱️ Tiempo restante: {formatTime(tiempoRestante)}
          {tiempoRestante <= 60 && <span className="urgent-warning"> - ¡Apúrate!</span>}
        </div>

        <div className="info-bar">
          <span className="info-box">CÓDIGO: {partidaId.substring(0, 6).toUpperCase()}</span>
          <span className="info-box">Jugadores: {jugadores.length}/{maxJugadores}</span>
          {esLider && <span className="lider-badge">👑 LÍDER</span>}
        </div>

        <div className="players-list">
          {jugadores.map((jugador, index) => (
            <div 
              key={jugador.socketID || index} 
              className={`player-item ${
                jugador.nickname === currentUserNickname ? 'current-player' : ''
              } ${
                jugador.isReady ? 'ready-player' : ''
              }`}
            >
              <span>
                {index === 0 && '👑 '}{jugador.nickname} {jugador.nickname === currentUserNickname ? '(Tú)' : ''}
              </span>
              <span className="ready-status">
                {jugador.isReady ? '✅ LISTO' : '⏳ Esperando...'}
              </span>
            </div>
          ))}
          
          {Array(Math.max(0, maxJugadores - jugadores.length)).fill(0).map((_, index) => (
            <div key={`empty-${index}`} className="empty-player-item">Esperando jugador...</div>
          ))}
        </div>
        
        <button 
          onClick={handleToggleReady}
          className={`ready-button ${isReady ? 'is-ready' : 'not-ready'}`}
        >
          {isReady ? '✅ YA ESTOY LISTO' : '⏳ MARCAR LISTO'}
        </button>

        {puedeIniciar && (
          <div className="start-section">
            <p className="start-message">¡Todos listos! La partida puede comenzar.</p>
            <button 
              onClick={handleEmitStartGame} 
              className="start-button"
            >
              🚀 INICIAR JUEGO
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaDeEspera;