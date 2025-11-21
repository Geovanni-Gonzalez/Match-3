// client/src/views/MenuPrincipal.tsx
import React, { useState, useEffect } from 'react';

interface UserSession {
  nickname: string;
  socketID: string;
}


interface MenuPrincipalProps {
  currentUser: UserSession;
  onLogout: () => void;
  // onStartNewGame: () => void; // Para la siguiente fase
}

export const MenuPrincipal: React.FC<MenuPrincipalProps> = ({ currentUser, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 
  

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
      <h1>Menú Principal</h1>
      <h2>Usuario: {currentUser.nickname}</h2>
      <button onClick={onLogout} style={styles.logoutButton}>Salir</button> 
      
      <div style={styles.options}>
        <button onClick={handleNewGame} style={{ ...styles.actionButton, backgroundColor: '#4CAF50' }}>
          Crear Partida Nueva
        </button>
        <button onClick={() => console.log('Navegar a Unirse a Partida')} style={{ ...styles.actionButton, backgroundColor: '#FF9800' }}>
          Unirse a Partida
        </button>
        <button onClick={() => console.log('Navegar a Ranking')} style={{ ...styles.actionButton, backgroundColor: '#2196F3' }}>
          Ver Ranking 
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  menuContainer: {
    padding: '50px',
    backgroundColor: '#0c138eff',
    borderRadius: '10px',
    width: '500px',
    height: '400px',
    boxShadow: '0 5px 8px rgba(255, 255, 255, 0.3)',
    position: 'relative', // permitir posicionamiento absoluto dentro del contenedor
  },
  logoutButton: {
    position: 'absolute',
    top: '20px',
    left: '20px', // mover a la esquina superior izquierda
    padding: '5px 10px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  options: {
    display: 'flex', //Vertical stack con espacio entre ellos
    height: '200px',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    margin: '40px 0',
  },
  actionButton: {
    padding: '15px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    fontWeight: 'bold',
    minWidth: '200px',
  },
  sectionHeader: {
    borderBottom: '1px solid #444',
    paddingBottom: '10px',
    marginBottom: '15px',
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
};