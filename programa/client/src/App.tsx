// client/src/App.tsx
import React, { useState } from 'react';
import { Bienvenida } from './views/Bienvenida';
import { MenuPrincipal } from './views/MenuPrincipal';
import { LobbyPartidas } from './views/LobbyPartidas';
import { CrearPartida } from './views/CrearPartida';
import { RankingHistorico } from './views/RankingHistorico'; // <-- Nuevo Import

// --- Definición de Tipos ---
// Tipo unificado para controlar todas las vistas de la aplicación
type AppView = 'welcome' | 'menu' | 'lobby' | 'ranking' | 'create_game' | 'game';

interface UserSession {
  nickname: string;
  socketID: string;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('welcome'); 
  const [currentGameId, setCurrentGameId] = useState<string | null>(null); 

  // --- Funciones de Manejo de Estado y Navegación ---
  const handleNavigation = (view: AppView) => {
    setCurrentView(view);
  };

  const handleLoginSuccess = (nickname: string) => {
    setCurrentUser({ nickname, socketID: 'mock-socket-id-' + Math.random().toString(10) });
    setCurrentView('menu');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('welcome');
    setCurrentGameId(null);
  };

  const handleJoinGameSuccess = (partidaId: string) => {
    setCurrentGameId(partidaId);
    handleNavigation('game');
  };

  const handleCreateGameSuccess = (partidaId: string) => {
    setCurrentGameId(partidaId);
    handleNavigation('game'); 
  };

  let content;

  // --- Router principal (Switch Case) ---
  switch (currentView) {
    case 'welcome':
      content = <Bienvenida onLoginSuccess={handleLoginSuccess} />;
      break;
      
    case 'menu':
      if (!currentUser) {
        content = <h1 style={{color: 'red'}}>Error de Sesión.</h1>;
        break;
      }
      content = (
          <MenuPrincipal 
              currentUser={currentUser} 
              onLogout={handleLogout} 
              onNavigate={handleNavigation}
          />
      );
      break;

    case 'lobby':
        content = (
            <LobbyPartidas 
                onBack={() => handleNavigation('menu')} 
                onJoinSuccess={handleJoinGameSuccess} 
            />
        );
        break;

    case 'create_game':
        content = (
            <CrearPartida 
                onBack={() => handleNavigation('menu')} 
                onCreateSuccess={handleCreateGameSuccess} 
            />
        );
        break;

    case 'ranking':
        // <-- Implementación del componente RankingHistorico -->
        content = (
            <RankingHistorico
                onBack={() => handleNavigation('menu')} // Regresa al menú
            />
        );
        break;

    case 'game':
      // Vista del juego en tiempo real
      content = (
          <div>
              <h1 style={{color: 'orange'}}>🕹️ Partida Activa</h1>
              <p>Jugando como: {currentUser?.nickname}. Código de Partida: {currentGameId}</p>
              <button onClick={() => handleNavigation('menu')} style={styles.backButton}>Abandonar Partida</button>
          </div>
      );
      break;

    default:
      content = <Bienvenida onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App" style={styles.container}>
      {content}
      {/* Indicador visual de la vista actual para depuración */}
      {/* <div style={{position: 'absolute', bottom: 10, right: 10, fontSize: 12, color: '#aaa'}}>Vista: {currentView}</div> */}
    </div>
  );
};

export default App;

// --- Estilos Globales ---
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
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '20px',
  }
};