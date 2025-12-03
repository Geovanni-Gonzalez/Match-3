// client/src/views/SalaDeEspera.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 

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
    <div style={styles.windowFrame}>
      {/* Notificación de timeout */}
      {showTimeoutNotification && (
        <div style={styles.notificationOverlay}>
          <div style={styles.notificationBubble}>
            <div style={styles.notificationIcon}>⏰</div>
            <div style={styles.notificationContent}>
              <h3 style={styles.notificationTitle}>Partida Cancelada</h3>
              <p style={styles.notificationMessage}>
                La partida ha sido cancelada por inactividad (3 minutos sin iniciar)
              </p>
              <p style={styles.notificationSubtext}>Redirigiendo al menú principal...</p>
            </div>
          </div>
        </div>
      )}

      <div style={styles.backButton} onClick={handleLeaveRoom}>&larr;</div>
      
      <h1 style={styles.title}>Sala de Espera</h1>

      {/* Indicador de tiempo restante */}
      <div style={{
        ...styles.timeoutWarning,
        backgroundColor: getTimeColor()
      }}>
        ⏱️ Tiempo restante: {formatTime(tiempoRestante)}
        {tiempoRestante <= 60 && <span style={styles.urgentWarning}> - ¡Apúrate!</span>}
      </div>

      <div style={styles.infoBar}>
        <span style={styles.infoBox}>CÓDIGO: {partidaId.substring(0, 6).toUpperCase()}</span>
        <span style={styles.infoBox}>Jugadores: {jugadores.length}/{maxJugadores}</span>
        {esLider && <span style={styles.liderBadge}>👑 LÍDER</span>}
      </div>

      <div style={styles.playersList}>
        {jugadores.map((jugador, index) => (
          <div 
            key={jugador.socketID || index} 
            style={{
              ...styles.playerItem,
              ...(jugador.nickname === currentUserNickname ? styles.currentPlayer : {}),
              ...(jugador.isReady ? styles.readyPlayer : {}),
            }}
          >
            {index === 0 && '👑 '}{jugador.nickname} {jugador.nickname === currentUserNickname ? '(Tú)' : ''}
            <span style={styles.readyStatus}>
              {jugador.isReady ? '✅ LISTO' : '⏳ Esperando...'}
            </span>
          </div>
        ))}
        
        {Array(Math.max(0, maxJugadores - jugadores.length)).fill(0).map((_, index) => (
            <div key={`empty-${index}`} style={styles.emptyPlayerItem}>Esperando jugador...</div>
        ))}
      </div>
      
      <button 
        onClick={handleToggleReady}
        style={{
          ...styles.readyButton,
          backgroundColor: isReady ? '#4CAF50' : '#FF9800', 
        }}
      >
        {isReady ? 'YA ESTOY LISTO' : 'MARCAR LISTO'}
      </button>

      {puedeIniciar && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={styles.startMessage}>¡Todos listos! La partida puede comenzar.</p>
            <button 
                onClick={handleEmitStartGame} 
                style={styles.startButton}
            >
                INICIAR JUEGO
            </button>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  windowFrame: { padding: '30px', borderRadius: '10px', backgroundColor: '#333744', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)', width: '450px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white' },
  backButton: { position: 'absolute', top: '15px', left: '15px', fontSize: '24px', cursor: 'pointer', padding: '5px', borderRadius: '5px', color: '#FF6347', fontWeight: 'bold' },
  title: { fontSize: '32px', color: '#61dafb', marginBottom: '20px' },
  infoBar: { display: 'flex', justifyContent: 'space-around', width: '100%', padding: '10px 0', marginBottom: '20px', borderBottom: '1px solid #444', gap: '10px' },
  infoBox: { backgroundColor: '#444857', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', fontSize: '14px' },
  liderBadge: { backgroundColor: '#FFD700', color: '#000', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', fontSize: '14px' },
  playersList: { width: '100%', maxHeight: '300px', overflowY: 'auto', marginBottom: '30px', padding: '0 10px' },
  playerItem: { padding: '12px 15px', margin: '8px 0', borderRadius: '8px', backgroundColor: '#444857', borderLeft: '5px solid #FF9800', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', transition: 'all 0.3s' },
  currentPlayer: { backgroundColor: '#2196F3', borderLeft: '5px solid #1565C0' },
  readyPlayer: { borderLeft: '5px solid #4CAF50', color: '#fff' },
  readyStatus: { fontSize: '12px', fontWeight: 'normal' },
  emptyPlayerItem: { padding: '12px 15px', margin: '8px 0', borderRadius: '8px', backgroundColor: '#555866', color: '#bbb', textAlign: 'center', borderLeft: '5px solid #777', fontStyle: 'italic' },
  readyButton: { padding: '15px 40px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', marginTop: '10px', transition: 'background-color 0.2s' },
  startButton: { padding: '15px 40px', backgroundColor: '#61dafb', color: '#282c34', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', marginTop: '10px', animation: 'pulse 1.5s infinite' },
  errorText: { color: '#ff6b6b' },
  startMessage: { color: '#4CAF50', fontWeight: 'bold', marginTop: '5px' },
  timeoutWarning: { 
    padding: '12px 20px', 
    borderRadius: '8px', 
    marginBottom: '15px', 
    fontWeight: 'bold', 
    fontSize: '16px', 
    color: '#FFF',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    transition: 'background-color 0.3s'
  },
  urgentWarning: {
    fontSize: '14px',
    fontWeight: 'bold',
    animation: 'blink 1s infinite'
  },
  notificationOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    animation: 'fadeIn 0.3s ease-in'
  },
  notificationBubble: {
    backgroundColor: '#2a2d3a',
    borderRadius: '20px',
    padding: '30px 40px',
    maxWidth: '500px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    animation: 'slideDown 0.4s ease-out',
    border: '3px solid #FF4444'
  },
  notificationIcon: {
    fontSize: '60px',
    animation: 'pulse 1s infinite'
  },
  notificationContent: {
    flex: 1
  },
  notificationTitle: {
    fontSize: '24px',
    color: '#FF4444',
    margin: '0 0 10px 0',
    fontWeight: 'bold'
  },
  notificationMessage: {
    fontSize: '16px',
    color: '#FFF',
    margin: '0 0 10px 0',
    lineHeight: '1.5'
  },
  notificationSubtext: {
    fontSize: '14px',
    color: '#AAA',
    margin: 0,
    fontStyle: 'italic'
  }
};