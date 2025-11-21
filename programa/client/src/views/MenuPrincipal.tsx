// client/src/views/MenuPrincipal.tsx
import React, { useState, useEffect } from 'react';

interface UserSession {
  nickname: string;
  socketID: string;
}

interface PartidaDisponible {
  id: string;
  tipo: 'Match' | 'Tiempo';
  jugadores: number;
}

interface MenuPrincipalProps {
  currentUser: UserSession;
  onLogout: () => void;
  // onStartNewGame: () => void; // Para la siguiente fase
}

export const MenuPrincipal: React.FC<MenuPrincipalProps> = ({ currentUser, onLogout }) => {
  const [partidasDisponibles, setPartidasDisponibles] = useState<PartidaDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPartidas();
    // En un entorno real, aquí se inicializaría la conexión Socket.IO 
    // y se escucharía el evento 'partida_creada' o 'lobby_update'.
  }, []);

  const fetchPartidas = async () => {
    setLoading(true);
    setError(null);
    try {
      // REQ-011: Llama a la ruta REST para obtener partidas disponibles (GET /api/partidas)
      const response = await fetch('http://localhost:4000/api/partidas'); 
      const data: PartidaDisponible[] = await response.json();
      
      if (response.ok) {
        setPartidasDisponibles(data);
      } else {
        setError('Error al cargar partidas del servidor.');
      }
    } catch (e) {
      setError('Fallo de conexión con el servidor backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = (partidaId: string) => {
    // REQ-012: Aquí se enviaría el evento Socket.IO 'unirse_partida'
    console.log(`Intentando unirse a la partida: ${partidaId} con ${currentUser.nickname}`);
    // Navegar a la vista de Partida
  };
  
  const handleNewGame = () => {
      // Navegar a un formulario de 'Crear Partida' que haga POST a /api/partidas
      console.log("Navegar a vista de creación de partida.");
  };

  return (
    <div style={styles.menuContainer}>
      <h2>👋 ¡Hola, {currentUser.nickname}!</h2>
      <button onClick={onLogout} style={styles.logoutButton}>Cerrar Sesión</button>
      
      <div style={styles.options}>
        <button onClick={handleNewGame} style={{ ...styles.actionButton, backgroundColor: '#4CAF50' }}>
          ➕ Crear Partida Nueva
        </button>
        <button onClick={() => console.log('Navegar a Ranking')} style={{ ...styles.actionButton, backgroundColor: '#2196F3' }}>
          🏆 Ver Ranking Histórico
        </button>
      </div>

      <h3 style={styles.sectionHeader}>Salas Disponibles para Unirse</h3>
      {loading && <p>Cargando partidas...</p>}
      {error && <p style={styles.errorText}>Error: {error}</p>}
      
      <button onClick={fetchPartidas} style={styles.refreshButton}>🔄 Recargar</button>

      <ul style={styles.list}>
        {partidasDisponibles.length === 0 && !loading && <p>No hay partidas en espera.</p>}
        {partidasDisponibles.map((p) => (
          <li key={p.id} style={styles.listItem}>
            <span>[{p.id}] - Tipo: {p.tipo}</span>
            <span>Jugadores: {p.jugadores}/2</span>
            <button onClick={() => handleJoinGame(p.id)} style={styles.joinButton}>
              Unirse
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    menuContainer: {
        padding: '20px',
        backgroundColor: '#333744',
        borderRadius: '10px',
        width: '500px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    },
    logoutButton: {
        position: 'absolute',
        top: '20px',
        right: '20px',
        padding: '5px 10px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    options: {
        display: 'flex',
        justifyContent: 'space-around',
        margin: '20px 0',
    },
    actionButton: {
        padding: '12px 20px',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        minWidth: '200px',
    },
    sectionHeader: {
        borderBottom: '1px solid #444',
        paddingBottom: '10px',
        marginBottom: '15px',
    },
    list: {
        listStyle: 'none',
        padding: 0,
    },
    listItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#444857',
        padding: '10px 15px',
        margin: '8px 0',
        borderRadius: '5px',
    },
    joinButton: {
        padding: '8px 15px',
        backgroundColor: '#61dafb',
        color: '#282c34',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    errorText: {
        color: '#ff6b6b',
    },
    refreshButton: {
        padding: '5px 10px',
        backgroundColor: '#ff9800',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginBottom: '10px',
    }
};