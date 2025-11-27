// client/src/App.tsx
import React, { useState } from 'react';
import { Bienvenida } from './views/Bienvenida';
import { MenuPrincipal } from './views/MenuPrincipal';
import { LobbyPartidas } from './views/LobbyPartidas';
import { CrearPartida } from './views/CrearPartida';
import { RankingHistorico } from './views/RankingHistorico';
import { SalaDeEspera } from './views/SalaDeEspera'; 
import { Juego } from './views/Juego';
import { useAuth } from './context/AuthContext';

// --- Tipos ---
type AppView = 'welcome' | 'menu' | 'lobby' | 'ranking' | 'create_game' | 'waiting_room' | 'game';

// Interfaz para las celdas del tablero
interface Celda {
  id: number;
  color: string;
}

const App: React.FC = () => {
  const { currentUser, login, logout } = useAuth();
  
  const [currentView, setCurrentView] = useState<AppView>('welcome'); 
  const [currentGameId, setCurrentGameId] = useState<string | null>(null); 
  
  // Estado para guardar el tablero inicial que envía el servidor
  const [initialBoard, setInitialBoard] = useState<Celda[][]>([]);

  const handleNavigation = (view: AppView) => {
    setCurrentView(view);
  };

  const handleLoginSuccess = async (nickname: string) => {
    await login(nickname); 
    setCurrentView('menu');
  };

  const handleLogout = () => {
    logout();
    setCurrentView('welcome');
    setCurrentGameId(null);
    setInitialBoard([]); // Limpiar tablero al salir
  };

  const handleGoToWaitingRoom = (partidaId: string) => {
    setCurrentGameId(partidaId);
    handleNavigation('waiting_room');
  };

  // --- MODIFICADO: Ahora recibe el tablero del servidor ---
  const handleStartGame = (partidaId: string, tableroServidor: any[]) => {
    setCurrentGameId(partidaId);
    setInitialBoard(tableroServidor); // Guardamos la matriz recibida
    handleNavigation('game');
  };

  let content;

  switch (currentView) {
    case 'welcome':
      if (currentUser) {
          setCurrentView('menu'); 
          content = null;
      } else {
          content = <Bienvenida onLoginSuccess={handleLoginSuccess} />;
      }
      break;
      
    case 'menu':
      if (!currentUser) {
        content = <Bienvenida onLoginSuccess={handleLoginSuccess} />;
      } else {
        content = (
            <MenuPrincipal 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                onNavigate={handleNavigation}
            />
        );
      }
      break;

    case 'lobby':
        content = (
            <LobbyPartidas 
                onBack={() => handleNavigation('menu')} 
                onJoinSuccess={handleGoToWaitingRoom} 
            />
        );
        break;

    case 'create_game':
        content = (
            <CrearPartida 
                onBack={() => handleNavigation('menu')} 
                onCreateSuccess={handleGoToWaitingRoom} 
            />
        );
        break;

    case 'ranking':
        content = (
            <RankingHistorico
                onBack={() => handleNavigation('menu')} 
            />
        );
        break;

    case 'waiting_room':
        if (!currentGameId || !currentUser) return null;
        content = (
            <SalaDeEspera 
                partidaId={currentGameId}
                currentUserNickname={currentUser.nickname}
                onLeave={() => handleNavigation('menu')}
                onStartGame={handleStartGame} // Pasamos la función que recibe el tablero
            />
        );
        break;

    case 'game':
      if (!currentGameId || !currentUser) return null;
      content = (
          <Juego 
            partidaId={currentGameId}
            currentUserNickname={currentUser.nickname}
            initialTablero={initialBoard} // <--- Enviamos el tablero al juego
            onLeave={() => handleNavigation('menu')}
          />
      );
      break;

    default:
      content = <Bienvenida onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App" style={styles.container}>
      {content}
    </div>
  );
};

export default App;

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    backgroundColor: '#282c34',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
};