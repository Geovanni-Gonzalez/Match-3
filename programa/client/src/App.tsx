/**
 * @file App.tsx
 * @description Componente raíz de la aplicación cliente.
 * 
 * Maneja la navegación utilizando react-router-dom y transiciones animadas.
 */

import React, { useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Bienvenida } from './views/Bienvenida';
import { MenuPrincipal } from './views/MenuPrincipal';
import { LobbyPartidas } from './views/LobbyPartidas';
import { CrearPartida } from './views/CrearPartida';
import { RankingHistorico } from './views/RankingHistorico';
import { SalaDeEspera } from './views/SalaDeEspera';
import { useAuth } from './context/AuthContext';
import { GameProvider, useGame } from './context/GameContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Juego } from './views/Juego';

const App: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nodeRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <GameProvider>
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white overflow-x-hidden relative font-sans text-center">
        <TransitionGroup component={null}>
          <CSSTransition
            key={location.key}
            nodeRef={nodeRef}
            classNames="page"
            timeout={300}
          >
            <div ref={nodeRef} className="absolute inset-0 w-full h-full">
              <ErrorBoundary>
                <Routes location={location}>
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
                      />
                    </ProtectedRoute>
                  } />

                  <Route path="/juego/:partidaId" element={
                    <ProtectedRoute>
                      <JuegoWrapper
                        onLeave={() => navigate('/menu')}
                      />
                    </ProtectedRoute>
                  } />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </div>
          </CSSTransition>
        </TransitionGroup>
      </div>
    </GameProvider>
  );
};

// Wrappers para extraer params y props

const SalaDeEsperaWrapper = ({ onLeave }: any) => {
  const { partidaId } = useParams();
  const { startGame } = useGame();
  const navigate = useNavigate();

  if (!partidaId) return <Navigate to="/menu" />;

  return (
    <SalaDeEspera
      partidaId={partidaId}
      onLeave={onLeave}
      onStartGame={(id, tablero, config) => {
        startGame(tablero, config);
        navigate(`/juego/${id}`);
      }}
    />
  );
};

const JuegoWrapper = ({ onLeave }: any) => {
  const { partidaId } = useParams();
  const { currentUser } = useAuth();
  const { initialBoard, initialConfig } = useGame();

  if (!partidaId || !initialBoard || !initialConfig) {
    // Si recarga la página en juego, faltará estado. Redirigir.
    return <Navigate to="/menu" />;
  }

  return (
    <Juego
      partidaId={partidaId}
      currentUserNickname={currentUser?.nickname || ''}
      initialTablero={initialBoard}
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
