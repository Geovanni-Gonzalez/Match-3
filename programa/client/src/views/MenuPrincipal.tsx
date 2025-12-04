import React from 'react';
import './MenuPrincipal.css';

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
  const handleUnirsePartida = () => {
      onNavigate('lobby'); 
      console.log("Navegar a vista de lobby de partidas.");
  }
  
  const handleNuevoJuego = () => {
      onNavigate('create_game'); 
      console.log("Navegar a vista de crear partida.");
  }

  const handleVerRanking = () => {
      onNavigate('ranking');
      console.log("Navegar a vista de ranking.");
  }

  return (
    <div className="menu-container">
      {/* Fondo animado */}
      <div className="menu-background"></div>
      
      {/* Partículas decorativas */}
      {[...Array(30)].map((_, i) => (
        <div 
          key={`particle-${i}`}
          className="menu-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
      
      {/* Gemas decorativas flotantes - estilo Match-3 */}
      <div className="gem gem-red" style={{top: '10%', left: '10%', animationDelay: '0s'}}>💎</div>
      <div className="gem gem-blue" style={{top: '15%', right: '15%', animationDelay: '1s'}}>💠</div>
      <div className="gem gem-green" style={{bottom: '20%', left: '8%', animationDelay: '2s'}}>🔷</div>
      <div className="gem gem-yellow" style={{top: '60%', right: '10%', animationDelay: '1.5s'}}>⭐</div>
      <div className="gem gem-purple" style={{bottom: '10%', right: '20%', animationDelay: '0.5s'}}>🔮</div>
      <div className="gem gem-orange" style={{top: '40%', left: '5%', animationDelay: '2.5s'}}>🧡</div>
      
      {/* Burbujas decorativas */}
      {[...Array(8)].map((_, i) => (
        <div 
          key={`bubble-${i}`}
          className="bubble"
          style={{
            left: `${10 + i * 12}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${6 + Math.random() * 3}s`,
          }}
        />
      ))}
      
      <div className="menu-card">
        {/* Botón de cerrar sesión */}
        <button onClick={onLogout} className="logout-button">
          <span>Salir</span>
        </button>
        
        {/* Header con bienvenida */}
        <div className="menu-header">
          <h1 className="menu-title">Menu Principal</h1>
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
