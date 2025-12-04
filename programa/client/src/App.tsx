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
type AppView =
  | 'welcome'
  | 'menu'
  | 'lobby'
  | 'ranking'
  | 'create_game'
  | 'waiting_room'
  | 'game';

// --- Tipo coherente con el backend ---
export interface Celda {
  tipo: number;
  estado?: string;
}

const App: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  // Tablero inicial que envía el servidor
  const [initialBoard, setInitialBoard] = useState<Celda[][]>([]);
  const [initialConfig, setInitialConfig] = useState<any>(null);

  const handleNavigation = (view: AppView) => {
    setCurrentView(view);
  };

  const handleLogout = () => {
    logout();
    setCurrentView('welcome');
    setCurrentGameId(null);
    setInitialBoard([]);
    setInitialConfig(null);
  };

  const handleGoToWaitingRoom = (partidaId: string) => {
    setCurrentGameId(partidaId);
    handleNavigation('waiting_room');
  };

  // Recibe el tablero generado por el servidor vía sockets
  const handleStartGame = (partidaId: string, tableroServidor: Celda[][], config: any) => {
    setCurrentGameId(partidaId);
    setInitialBoard(tableroServidor);
    setInitialConfig(config);
    handleNavigation('game');
  };

  let content;

  switch (currentView) {
    case 'welcome':
      content = !currentUser ? <Bienvenida /> : null;
      if (currentUser) {
        setTimeout(() => handleNavigation('menu'), 0);
      }
      break;

    case 'menu':
      content = currentUser ? (
        <MenuPrincipal
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigate={handleNavigation}
        />
      ) : (
        <Bienvenida />
      );
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
      content = <RankingHistorico onBack={() => handleNavigation('menu')} />;
      break;

    case 'waiting_room':
      if (!currentGameId || !currentUser) return null;
      content = (
        <SalaDeEspera
          {...({
            partidaId: currentGameId,
            currentUserNickname: currentUser.nickname,
            onLeave: () => handleNavigation('menu'),
            onStartGame: handleStartGame,
          } as any)}
        />
      );
      break;

    case 'game':
      if (!currentGameId || !currentUser || !gameInfo) return null;
      content = (
        <Juego
          {...({
            partidaId: currentGameId,
            currentUserNickname: currentUser.nickname,
            initialTablero: initialBoard,
            initialConfig: initialConfig,
            onLeave: () => handleNavigation('menu'),
          } as any)}
        />
      );
      break;

    default:
      content = <Bienvenida />;
  }

  return (
    <div className="App" style={styles.container}>
      {content}
    </div>
  );
};

export default App;

// --- Estilos ---
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
