/**
 * @file App.tsx
 * @description Componente raíz de la aplicación cliente.
 * 
 * Maneja la navegación entre las distintas vistas de la aplicación:
 * - Bienvenida / Login.
 * - Menú Principal.
 * - Crear Partida / Lobby / Ranking.
 * - Sala de Espera.
 * - Juego Activo.
 * 
 * Coordina el flujo del usuario y mantiene el estado global de navegación.
 */

import React, { useState } from 'react';
import { Bienvenida } from './views/Bienvenida';
import { MenuPrincipal } from './views/MenuPrincipal';
import { LobbyPartidas } from './views/LobbyPartidas';
import { CrearPartida } from './views/CrearPartida';
import { RankingHistorico } from './views/RankingHistorico';
import { SalaDeEspera } from './views/SalaDeEspera';
import { Juego } from './views/Juego';
import { useAuth } from './context/AuthContext';
import './styles/App.css';

// --- Tipos ---

/** Posibles vistas de la aplicación. */
type AppView =
  | 'welcome'
  | 'menu'
  | 'lobby'
  | 'ranking'
  | 'create_game'
  | 'waiting_room'
  | 'game';

/** Representación de una celda del tablero (coherente con backend). */
export interface Celda {
  tipo: number;
  estado?: string;
}

/**
 * Componente principal de la aplicación cliente.
 */
const App: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  // Tablero inicial que envía el servidor
  const [initialBoard, setInitialBoard] = useState<Celda[][]>([]);
  const [initialConfig, setInitialConfig] = useState<any>(null);

  /**
   * Cambia la vista actual de la aplicación.
   * @param view - Vista a la que navegar.
   */
  const handleNavigation = (view: AppView) => {
    setCurrentView(view);
  };

  /**
   * Cierra la sesión del usuario y reinicia el estado de la aplicación.
   */
  const handleLogout = () => {
    logout();
    setCurrentView('welcome');
    setCurrentGameId(null);
    setInitialBoard([]);
    setInitialConfig(null);
  };

  /**
   * Navega a la sala de espera con el ID de partida proporcionado.
   * @param partidaId - ID de la partida.
   */
  const handleGoToWaitingRoom = (partidaId: string) => {
    setCurrentGameId(partidaId);
    handleNavigation('waiting_room');
  };

  /**
   * Inicia el juego con el tablero generado por el servidor.
   * @param partidaId - ID de la partida.
   * @param tableroServidor - Tablero inicial del juego.
   * @param config - Configuración de la partida.
   */
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
      if (!currentGameId || !currentUser || !initialConfig) return null;
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
    <div className="app-container">
      {content}
    </div>
  );
};

export default App;
