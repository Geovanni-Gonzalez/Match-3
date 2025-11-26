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
  // --- CORRECCIÓN AQUÍ: Agregamos 'jugadores' a la definición ---
  onStartGame: (partidaId: string, tablero: any[], jugadores: any[]) => void;
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

  useEffect(() => {
    if (!socket) return;

    console.log(`[Client] Uniéndose a sala: ${partidaId}`);
    socket.emit('join_room', { partidaId, nickname: currentUserNickname });

    socket.on('update_players_list', (listaServidor: JugadorSala[]) => {
        setJugadores(listaServidor);
    });

    socket.on('player_status_changed', (data) => {
        setJugadores(prev => prev.map(p => 
            p.socketID === data.socketID ? { ...p, isReady: data.isReady } : p
        ));
    });

    // --- CORRECCIÓN AQUÍ: Recibimos y pasamos 'jugadores' ---
    socket.on('game_started', (data: { tablero: any[], jugadores: any[] }) => {
        console.log('[Client] Partida iniciada. Datos recibidos:', data);
        // Pasamos los 3 argumentos requeridos por App.tsx
        onStartGame(partidaId, data.tablero, data.jugadores); 
    });

    return () => {
        socket.off('update_players_list');
        socket.off('player_status_changed');
        socket.off('game_started');
    };
  }, [socket, partidaId, currentUserNickname, onStartGame]);

  const handleToggleReady = () => {
    if (!socket) return;
    const newState = !isReady;
    setIsReady(newState); 
    socket.emit('player_ready', { partidaId, isReady: newState });
  };

  const handleEmitStartGame = () => {
      if (!socket) return;
      console.log('[Client] Solicitando iniciar partida...');
      socket.emit('start_game', { partidaId });
  };

  const allPlayersReady = jugadores.length >= 2 && jugadores.every(j => j.isReady);

  return (
    <div style={styles.windowFrame}>
      <div style={styles.backButton} onClick={onLeave}>&larr;</div>
      
      <h1 style={styles.title}>Sala de Espera</h1>

      <div style={styles.infoBar}>
        <span style={styles.infoBox}>CÓDIGO: {partidaId.substring(0, 6).toUpperCase()}</span>
        <span style={styles.infoBox}>Jugadores: {jugadores.length}/6</span>
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
            {jugador.nickname} {jugador.nickname === currentUserNickname ? '(Tú)' : ''}
            <span style={styles.readyStatus}>
              {jugador.isReady ? '✅ LISTO' : '⏳ Esperando...'}
            </span>
          </div>
        ))}
        
        {Array(Math.max(0, 6 - jugadores.length)).fill(0).map((_, index) => (
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

      {allPlayersReady && (
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
  infoBar: { display: 'flex', justifyContent: 'space-around', width: '100%', padding: '10px 0', marginBottom: '20px', borderBottom: '1px solid #444' },
  infoBox: { backgroundColor: '#444857', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', fontSize: '14px' },
  playersList: { width: '100%', maxHeight: '300px', overflowY: 'auto', marginBottom: '30px', padding: '0 10px' },
  playerItem: { padding: '12px 15px', margin: '8px 0', borderRadius: '8px', backgroundColor: '#444857', borderLeft: '5px solid #FF9800', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', transition: 'all 0.3s' },
  currentPlayer: { backgroundColor: '#2196F3', borderLeft: '5px solid #1565C0' },
  readyPlayer: { borderLeft: '5px solid #4CAF50', color: '#fff' },
  readyStatus: { fontSize: '12px', fontWeight: 'normal' },
  emptyPlayerItem: { padding: '12px 15px', margin: '8px 0', borderRadius: '8px', backgroundColor: '#555866', color: '#bbb', textAlign: 'center', borderLeft: '5px solid #777', fontStyle: 'italic' },
  readyButton: { padding: '15px 40px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', marginTop: '10px', transition: 'background-color 0.2s' },
  startButton: { padding: '15px 40px', backgroundColor: '#61dafb', color: '#282c34', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', marginTop: '10px', animation: 'pulse 1.5s infinite' },
  errorText: { color: '#ff6b6b' },
  startMessage: { color: '#4CAF50', fontWeight: 'bold', marginTop: '5px' }
};