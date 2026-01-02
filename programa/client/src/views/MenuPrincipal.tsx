/**
 * @file MenuPrincipal.tsx
 * @description Vista principal del menú del juego.
 * 
 * Presenta las opciones principales:
 * - Crear una nueva partida.
 * - Unirse a una partida existente.
 * - Ver el ranking histórico.
 * - Cerrar sesión.
 */

import React from 'react';
import '../styles/MenuPrincipal.css';
import { Logger } from '../utils/Logger';
import { Background } from '../components/Background';

// Definir los tipos de vista para el componente
type MenuViews = 'menu' | 'lobby' | 'ranking' | 'create_game' | 'game';

interface UserSession {
  nickname: string;
  socketID: string;
}

interface MenuPrincipalProps {
  /** Sesión del usuario actual. */
  currentUser: UserSession;
  /** Función para cerrar sesión. */
  onLogout: () => void;
  /** Función para notificar al padre qué vista mostrar. */
  onNavigate: (view: MenuViews) => void;
}

/**
 * Componente del menú principal con las opciones de navegación.
 */
export const MenuPrincipal: React.FC<MenuPrincipalProps> = ({ currentUser, onLogout, onNavigate }) => {

  // ... (el resto del estado y la lógica)

  const handleUnirsePartida = () => {
    // Usa onNavigate para cambiar a la vista del Lobby
    onNavigate('lobby');
    Logger.info("Navegar a vista de lobby de partidas.");
  }

  const handleNuevoJuego = () => {
    // Usa onNavigate para cambiar a la vista de Crear Partida
    onNavigate('create_game');
    Logger.info("Navegar a vista de creación de partida.");
  };

  const handleVerRanking = () => {
    onNavigate('ranking');
    Logger.info("Navegar a vista de ranking.");
  }

  return (
    <div className="menu-container">
      <Background />

      <div className="menu-card premium-card">
        {/* Botón de cerrar sesión */}
        <button onClick={onLogout} className="logout-button">
          <span>Salir</span>
        </button>

        {/* Header con bienvenida */}
        <div className="menu-header">
          <h1 className="menu-title premium-title">Menu Principal</h1>
          <p className="menu-welcome">
            ¡Bienvenido, <span className="menu-username">{currentUser.nickname}</span>!
          </p>
        </div>

        {/* Opciones del menú */}
        <div className="menu-options">
          <button onClick={handleNuevoJuego} className="menu-action-button">
            <span className="button-icon">➕</span>
            <span>Crear Partida Nueva</span>
          </button>

          <button onClick={handleUnirsePartida} className="menu-action-button">
            <span className="button-icon">🎯</span>
            <span>Unirse a Partida</span>
          </button>

          <button onClick={handleVerRanking} className="menu-action-button">
            <span className="button-icon">🏆</span>
            <span>Ver Ranking</span>
          </button>
        </div>
      </div>
    </div>
  );
};
