// client/src/App.tsx
import React, { useState } from 'react';
import { Bienvenida } from './views/Bienvenida';
import { MenuPrincipal } from './views/MenuPrincipal';
import { LobbyPartidas } from './views/LobbyPartidas'; // Importado

// --- Definición de Tipos ---
// Nuevo tipo para manejar todas las posibles vistas del menú
type AppView = 'welcome' | 'menu' | 'lobby' | 'ranking' | 'create_game' | 'game';

interface UserSession {
  nickname: string;
  socketID: string;
  // Otros datos de sesión...
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  // Usamos el tipo AppView expandido
  const [currentView, setCurrentView] = useState<AppView>('welcome'); 

  // --- 1. Función de Navegación Central ---
  const handleNavigation = (view: AppView) => {
    setCurrentView(view);
  };

  // Función que simula el proceso de login exitoso
  const handleLoginSuccess = (nickname: string) => {
    // En un entorno real, esta data vendría del POST /api/join o un servicio de autenticación
    setCurrentUser({ nickname, socketID: 'mock-socket-id-' + Math.random().toString(10) });
    setCurrentView('menu');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('welcome');
  };

  // Función al unirse a una partida desde el lobby (navega a 'game')
  const handleJoinGameSuccess = (partidaId: string) => {
    console.log(`Iniciando juego para ${partidaId}`);
    setCurrentView('game');
    // Aquí se pasaría el ID de partida al componente 'game'
  };


  let content;

  // --- 2. Switch Case con todas las vistas ---
  switch (currentView) {
    case 'welcome':
      content = <Bienvenida onLoginSuccess={handleLoginSuccess} />;
      break;
      
    case 'menu':
      if (!currentUser) {
        content = <h1 style={{color: 'red'}}>Error de Sesión.</h1>;
        break;
      }
      // Se pasa la función onNavigate al MenuPrincipal
      content = (
          <MenuPrincipal 
              currentUser={currentUser} 
              onLogout={handleLogout} 
              onNavigate={handleNavigation} // ⬅️ Conecta los botones del menú al cambio de vista
          />
      );
      break;

    case 'lobby':
        // Renderiza el componente de Lobby/Unirse a Partida
        content = (
            <LobbyPartidas 
                onBack={() => handleNavigation('menu')} // Botón de regreso al menú
                onJoinSuccess={handleJoinGameSuccess} 
            />
        );
        break;

    case 'create_game':
        // Vista para crear una partida nueva
        content = (
            <div>
                <h1 style={{color: 'yellow'}}>Vista: Crear Partida (POST /api/partidas)</h1>
                <button onClick={() => handleNavigation('menu')}>Regresar al Menú</button>
            </div>
        );
        break;

    case 'ranking':
        // Vista para ver el ranking histórico
        content = (
            <div>
                <h1 style={{color: 'lightgreen'}}>Vista: Ranking Histórico (GET /api/ranking)</h1>
                <button onClick={() => handleNavigation('menu')}>Regresar al Menú</button>
            </div>
        );
        break;

    case 'game':
      // Vista del juego en tiempo real
      content = <h1 style={{color: 'orange'}}>Vista de Partida (En Desarrollo)</h1>;
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