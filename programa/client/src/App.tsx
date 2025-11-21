// client/src/App.tsx
import React, { useState } from 'react';
import { Bienvenida } from './views/Bienvenida';
import { MenuPrincipal } from './views/MenuPrincipal';
// import { PartidaView } from './views/PartidaView'; // Vista futura

interface UserSession {
  nickname: string;
  socketID: string;
  // Otros datos de sesión...
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [currentView, setCurrentView] = useState<'welcome' | 'menu' | 'game'>('welcome');

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

  let content;

  switch (currentView) {
    case 'welcome':
      // Se combina la bienvenida y el login en la vista inicial.
      content = <Bienvenida onLoginSuccess={handleLoginSuccess} />;
      break;
    case 'menu':
      if (!currentUser) {
        content = <h1 style={{color: 'red'}}>Error de Sesión.</h1>;
        break;
      }
      content = <MenuPrincipal currentUser={currentUser} onLogout={handleLogout} />;
      break;
    case 'game':
      // content = <PartidaView currentUser={currentUser} />;
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