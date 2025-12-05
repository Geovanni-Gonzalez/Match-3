/**
 * @file App.tsx
 * @description Componente raíz de la aplicación cliente.
 * 
 * Maneja la navegación utilizando react-router-dom.
 */

import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Bienvenida } from './views/Bienvenida';
import { MenuPrincipal } from './views/MenuPrincipal';
import { LobbyPartidas } from './views/LobbyPartidas';
import { CrearPartida } from './views/CrearPartida';
import { RankingHistorico } from './views/RankingHistorico';
import { SalaDeEspera } from './views/SalaDeEspera';
import { Juego } from './views/Juego';
import { useAuth } from './context/AuthContext';
import './styles/App.css';
import { Celda } from './types/shared';

const App: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Estado global para el juego (podría moverse a un Contexto de Juego)
  const [initialBoard, setInitialBoard] = useState<Celda[][]>([]);
  const [initialConfig, setInitialConfig] = useState<any>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStartGame = (partidaId: string, tableroServidor: Celda[][], config: any) => {
    setInitialBoard(tableroServidor);
    setInitialConfig(config);
    navigate(`/juego/${partidaId}`);
  };



  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={
          currentUser ? <Navigate to="/menu" replace /> : <Bienvenida />
        } />

        <Route path="/menu" element={
          <ProtectedRoute>
            <MenuPrincipal
              currentUser={currentUser!}
              onLogout={handleLogout}
              onNavigate={(view) => {
                if (view === 'lobby') navigate('/lobby');
                if (view === 'create_game') navigate('/crear');
                if (view === 'ranking') navigate('/ranking');
              }}
            />
          </ProtectedRoute>
        } />

        <Route path="/lobby" element={
          <ProtectedRoute>
            <LobbyPartidas
              onBack={() => navigate('/menu')}
              onJoinSuccess={(id) => navigate(`/sala/${id}`)}
            />
          </ProtectedRoute>
        } />

        <Route path="/crear" element={
          <ProtectedRoute>
            <CrearPartida
              onBack={() => navigate('/menu')}
              onCreateSuccess={(id) => navigate(`/sala/${id}`)}
            />
          </ProtectedRoute>
        } />

        <Route path="/ranking" element={
          <ProtectedRoute>
            <RankingHistorico onBack={() => navigate('/menu')} />
          </ProtectedRoute>
        } />

        <Route path="/sala/:partidaId" element={
          <ProtectedRoute>
            <SalaDeEsperaWrapper
              onLeave={() => navigate('/menu')}
              onStartGame={handleStartGame}
            />
          </ProtectedRoute>
        } />

        <Route path="/juego/:partidaId" element={
          <ProtectedRoute>
            <JuegoWrapper
              initialTablero={initialBoard}
              initialConfig={initialConfig}
              onLeave={() => navigate('/menu')}
            />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

// Wrappers para extraer params y props

const SalaDeEsperaWrapper = ({ onLeave, onStartGame }: any) => {
  const { partidaId } = useParams();
  if (!partidaId) return <Navigate to="/menu" />;
  return <SalaDeEspera partidaId={partidaId} onLeave={onLeave} onStartGame={onStartGame} />;
};

const JuegoWrapper = ({ initialTablero, initialConfig, onLeave }: any) => {
  const { partidaId } = useParams();
  const { currentUser } = useAuth();

  if (!partidaId || !initialTablero || !initialConfig) {
    // Si recarga la página en juego, faltará estado. Redirigir.
    return <Navigate to="/menu" />;
  }

  return (
    <Juego
      partidaId={partidaId}
      currentUserNickname={currentUser?.nickname || ''}
      initialTablero={initialTablero}
      initialConfig={initialConfig}
      onLeave={onLeave}
    />
  );
};

// Wrapper para proteger rutas
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default App;
