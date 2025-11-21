// client/src/views/SalaDeEspera.tsx

import React, { useState, useEffect } from 'react';

// --- Interfaces de Tipos ---
interface PartidaInfo {
  id: string;
  tiempoRestante: string;
  jugadoresActuales: number;
  jugadoresMax: number;
  // Otros datos como tematica, tipoJuego, etc.
}

interface JugadorSala {
  nickname: string;
  isReady: boolean;
  isCurrentUser: boolean;
}

interface SalaDeEsperaProps {
  partidaId: string; // El ID de la partida obtenida al crear o unirse
  currentUserNickname: string;
  onLeave: () => void; // Función para salir de la sala (regresar al menú)
  onStartGame: (partidaId: string) => void; // Función para iniciar la vista del juego
}

export const SalaDeEspera: React.FC<SalaDeEsperaProps> = ({ 
  partidaId, 
  currentUserNickname, 
  onLeave, 
  onStartGame 
}) => {
  const [partidaInfo, setPartidaInfo] = useState<PartidaInfo | null>(null);
  const [jugadores, setJugadores] = useState<JugadorSala[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular la carga de información inicial de la partida (GET /api/partidas/{partidaId})
    const fetchPartidaInfo = () => {
      setPartidaInfo({
        id: partidaId,
        tiempoRestante: '2:55', // Simulación
        jugadoresActuales: 3,    // Simulación
        jugadoresMax: 6,         // Simulación
      });

      setJugadores([
        { nickname: 'Juan', isReady: true, isCurrentUser: false },
        { nickname: currentUserNickname, isReady: false, isCurrentUser: true }, // El usuario actual
        { nickname: 'Felipe', isReady: true, isCurrentUser: false },
      ]);
      setLoading(false);
    };

    fetchPartidaInfo();

    // Simular conexión WebSocket para actualización de jugadores y tiempo (polling simple)
    const interval = setInterval(() => {
        // En una implementación real, aquí se actualizaría el estado de la sala y los jugadores
        console.log(`[Socket Mock] Actualizando estado de la sala ${partidaId}...`);

        // Si todos están listos y la sala está llena, forzar inicio (simulación)
        if (jugadores.length === 3 && jugadores.every(j => j.isReady || j.isCurrentUser)) {
            // onStartGame(partidaId);
        }
    }, 5000);

    return () => clearInterval(interval);
  }, [partidaId, currentUserNickname, jugadores]);

  const handleToggleReady = () => {
    // Lógica para enviar el estado "Listo" al servidor (POST /api/partidas/{id}/ready)
    // setIsReady(!isReady); // Actualización local optimista

    // Simulación: Cambiar estado en el servidor
    const nuevoEstadoReady = !isReady;
    setIsReady(nuevoEstadoReady);
    
    // Actualizar la lista de jugadores localmente (simulación)
    setJugadores(prev => prev.map(j => 
      j.isCurrentUser ? { ...j, isReady: nuevoEstadoReady } : j
    ));

    console.log(`Enviar al servidor estado 'Ready': ${nuevoEstadoReady}`);
  };

  if (loading) {
    return <div style={styles.windowFrame}>Cargando sala...</div>;
  }

  if (error || !partidaInfo) {
    return <div style={styles.windowFrame}><p style={styles.errorText}>Error al cargar la sala: {error}</p></div>;
  }

  const allPlayersReady = jugadores.every(j => j.isReady) && jugadores.length === partidaInfo.jugadoresMax;
  
  return (
    <div style={styles.windowFrame}>
      {/* Botón de retroceso (usado para abandonar la sala) */}
      <div style={styles.backButton} onClick={onLeave}>
        &larr;
      </div>
      
      <h1 style={styles.title}>Sala de espera</h1>

      <div style={styles.infoBar}>
        <span style={styles.infoBox}>ID: {partidaInfo.id.substring(0, 8)}...</span>
        <span style={styles.infoBox}>Tiempo restante: {partidaInfo.tiempoRestante}</span>
        <span style={styles.infoBox}>Jugadores: {partidaInfo.jugadoresActuales}/{partidaInfo.jugadoresMax}</span>
      </div>

      <div style={styles.playersList}>
        {jugadores.map((jugador, index) => (
          <div 
            key={index} 
            style={{
              ...styles.playerItem,
              ...(jugador.isCurrentUser ? styles.currentPlayer : {}),
              ...(jugador.isReady ? styles.readyPlayer : {}),
            }}
          >
            {jugador.nickname} {jugador.isCurrentUser ? '(Tú)' : ''}
            <span style={styles.readyStatus}>
              {jugador.isReady ? 'LISTO' : 'Esperando...'}
            </span>
          </div>
        ))}

        {/* Placeholder para jugadores faltantes */}
        {Array(partidaInfo.jugadoresMax - jugadores.length).fill(0).map((_, index) => (
            <div key={`empty-${index}`} style={styles.emptyPlayerItem}>
                Esperando jugador...
            </div>
        ))}
      </div>
      
      {/* Botón Listo / Iniciar Partida */}
      <button 
        onClick={isReady ? () => {} : handleToggleReady} // Al hacer clic, marca "Listo"
        disabled={isReady || loading}
        style={{
          ...styles.readyButton,
          backgroundColor: isReady ? '#4CAF50' : '#FF9800', // Verde si Listo, Naranja si Esperando
        }}
      >
        {isReady ? 'LISTO' : 'Marcar Listo'}
      </button>

      {allPlayersReady && (
        <p style={styles.startMessage}>¡Todos listos! La partida iniciará pronto...</p>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  windowFrame: {
    padding: '30px',
    borderRadius: '10px',
    backgroundColor: '#333744',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
    width: '450px', 
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'white',
  },
  backButton: {
    position: 'absolute',
    top: '15px',
    left: '15px',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: '5px',
    color: '#FF6347', // Rojo/Naranja para Salir
    fontWeight: 'bold',
  },
  title: {
    fontSize: '32px',
    color: '#61dafb',
    marginBottom: '20px',
  },
  infoBar: {
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%',
    padding: '10px 0',
    marginBottom: '20px',
    borderBottom: '1px solid #444',
  },
  infoBox: {
    backgroundColor: '#444857',
    padding: '8px 15px',
    borderRadius: '5px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  playersList: {
    width: '100%',
    maxHeight: '300px',
    overflowY: 'auto',
    marginBottom: '30px',
    padding: '0 10px',
  },
  playerItem: {
    padding: '12px 15px',
    margin: '8px 0',
    borderRadius: '8px',
    backgroundColor: '#444857',
    borderLeft: '5px solid #FF9800',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 'bold',
    transition: 'all 0.3s',
  },
  currentPlayer: {
    backgroundColor: '#2196F3', // Azul para el usuario actual
    borderLeft: '5px solid #1565C0',
  },
  readyPlayer: {
    backgroundColor: '#4CAF50', // Verde para listo (como en la imagen)
    color: '#222',
  },
  readyStatus: {
    fontSize: '12px',
    fontWeight: 'normal',
  },
  emptyPlayerItem: {
    padding: '12px 15px',
    margin: '8px 0',
    borderRadius: '8px',
    backgroundColor: '#555866',
    color: '#bbb',
    textAlign: 'center',
    borderLeft: '5px solid #777',
    fontStyle: 'italic',
  },
  readyButton: {
    padding: '15px 40px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 'bold',
    marginTop: '10px',
    transition: 'background-color 0.2s',
  },
  errorText: {
    color: '#ff6b6b',
  },
  startMessage: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: '15px',
  }
};