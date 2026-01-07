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

  const handleUnirsePartida = () => {
    onNavigate('lobby');
    Logger.info("Navegar a vista de lobby de partidas.");
  }

  const handleNuevoJuego = () => {
    onNavigate('create_game');
    Logger.info("Navegar a vista de creación de partida.");
  };

  const handleVerRanking = () => {
    onNavigate('ranking');
    Logger.info("Navegar a vista de ranking.");
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center overflow-hidden p-5">
      <Background />

      <div className="relative w-[550px] max-w-[92vw] bg-white/5 backdrop-blur-3xl border border-white/10 p-[60px_50px] rounded-[30px] shadow-2xl animate-[headerSlideIn_0.6s_ease-out_0.3s_backwards] max-h-[95vh] overflow-y-auto">

        {/* Botón de cerrar sesión */}
        <button
          onClick={onLogout}
          className="absolute top-5 right-5 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg text-sm font-bold shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/50 active:translate-y-0 transition-all duration-300 z-20"
        >
          <span>Salir</span>
        </button>

        {/* Header con bienvenida */}
        <div className="text-center mb-12 animate-[headerSlideIn_0.6s_ease-out_0.3s_backwards]">
          <h1 className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 font-black tracking-tighter drop-shadow-lg mb-4">
            Menu Principal
          </h1>
          <p className="text-lg text-indigo-300 font-semibold drop-shadow-sm">
            ¡Bienvenido, <span className="text-white font-extrabold underline decoration-indigo-500 decoration-2">{currentUser.nickname}</span>!
          </p>
        </div>

        {/* Opciones del menú */}
        <div className="flex flex-col gap-5">
          <MenuButton
            onClick={handleNuevoJuego}
            delay="0.5s"
            gradient="from-emerald-600 to-emerald-500"
            shadow="shadow-emerald-600/40"
            icon="➕"
            label="Crear Partida Nueva"
          />

          <MenuButton
            onClick={handleUnirsePartida}
            delay="0.7s"
            gradient="from-orange-600 to-orange-500"
            shadow="shadow-orange-600/40"
            icon="🎯"
            label="Unirse a Partida"
          />

          <MenuButton
            onClick={handleVerRanking}
            delay="0.9s"
            gradient="from-sky-600 to-sky-500"
            shadow="shadow-sky-600/40"
            icon="🏆"
            label="Ver Ranking"
          />
        </div>
      </div>
    </div>
  );
};

interface MenuButtonProps {
  onClick: () => void;
  delay: string;
  gradient: string;
  shadow: string;
  icon: string;
  label: string;
}

const MenuButton: React.FC<MenuButtonProps> = ({ onClick, delay, gradient, shadow, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      relative w-full p-6 border-none rounded-xl cursor-pointer 
      flex items-center justify-center gap-3
      text-lg font-extrabold uppercase tracking-wider text-white
      bg-gradient-to-r ${gradient}
      shadow-lg ${shadow}
      transform transition-all duration-300
      hover:-translate-y-1 hover:scale-[1.02]
      active:-translate-y-0.5 active:scale-[0.98]
      overflow-hidden group
      animate-[buttonSlideIn_0.6s_ease-out_backwards]
    `}
    style={{ animationDelay: delay }}
  >
    {/* Shine effect */}
    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700 group-hover:left-full"></div>

    <span className="text-2xl drop-shadow-md z-10">{icon}</span>
    <span className="z-10">{label}</span>
  </button>
);
