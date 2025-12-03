import React from 'react';
// Definir los tipos de vista para el componente
type MenuViews = 'menu' | 'lobby' | 'ranking' | 'create_game' | 'game';

interface UserSession {
  nickname: string;
  socketID: string;
}

interface MenuPrincipalProps {
  currentUser: UserSession;
  onLogout: () => void;
  // NUEVA PROP: Función para notificar al padre qué vista mostrar
  onNavigate: (view: MenuViews) => void; 
}

export const MenuPrincipal: React.FC<MenuPrincipalProps> = ({ currentUser, onLogout, onNavigate }) => {
  // Eliminamos los estados 'loading' y 'error' que no se usaban
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  const handleUnirsePartida = () => {
      // Usa onNavigate para cambiar a la vista del Lobby
      onNavigate('lobby'); 
      console.log("Navegar a vista de lobby de partidas.");
  }
  
  const handleNuevoJuego = () => {
      // Usa onNavigate para cambiar a la vista de Crear Partida
      onNavigate('create_game'); 
      console.log("Navegar a vista de crear partida.");
  }

  const handleVerRanking = () => {
      // Usa onNavigate para cambiar a la vista de Ranking
      onNavigate('ranking');
      console.log("Navegar a vista de ranking.");
  }

  return (
    <div style={styles.menuContainer}>
      <button onClick={onLogout} style={styles.logoutButton}>
        Cerrar Sesión
      </button>
      
      <h1 style={{color: 'white', marginBottom: '40px'}}>
        Bienvenido, {currentUser.nickname}
      </h1>

      <div style={styles.options}>
        <button onClick={handleNuevoJuego} style={{ ...styles.actionButton, backgroundColor: '#4CAF50' }}>
          Crear Partida Nueva
        </button>
        
        <button onClick={handleUnirsePartida} style={{ ...styles.actionButton, backgroundColor: '#FF9800' }}>
          Unirse a Partida
        </button>
        
        <button onClick={handleVerRanking} style={{ ...styles.actionButton, backgroundColor: '#2196F3' }}>
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
    position: 'relative', 
  },
  logoutButton: {
    position: 'absolute',
    top: '20px',
    left: '20px', 
    padding: '5px 10px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  options: {
    display: 'flex',
    height: '200px',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    margin: '10px 0',
  },
  actionButton: {
    padding: '15px 30px',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '18px',
    width: '80%',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
  }
};