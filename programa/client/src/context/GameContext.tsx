import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Logger } from '../utils/Logger';
import { Celda, GameConfig } from '@match3/shared';

interface GameContextType {
  initialBoard: Celda[][] | null;
  initialConfig: GameConfig | null;
  startGame: (board: Celda[][], config: GameConfig) => void;
  clearGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [initialBoard, setInitialBoard] = useState<Celda[][] | null>(null);
  const [initialConfig, setInitialConfig] = useState<GameConfig | null>(null);

  // Persistence Logic
  useEffect(() => {
    const savedBoard = localStorage.getItem('match3_board');
    const savedConfig = localStorage.getItem('match3_config');

    if (savedBoard && savedConfig) {
      try {
        setInitialBoard(JSON.parse(savedBoard));
        setInitialConfig(JSON.parse(savedConfig));
        Logger.info("[GameContext] Game state restored from localStorage");
      } catch (e) {
        Logger.error("Error parsing saved game state", e);
        localStorage.removeItem('match3_board');
        localStorage.removeItem('match3_config');
      }
    }
  }, []);

  const startGame = (board: Celda[][], config: GameConfig) => {
    setInitialBoard(board);
    setInitialConfig(config);

    // Save to persistence
    localStorage.setItem('match3_board', JSON.stringify(board));
    localStorage.setItem('match3_config', JSON.stringify(config));
  };

  const clearGame = () => {
    setInitialBoard(null);
    setInitialConfig(null);

    // Clear persistence
    localStorage.removeItem('match3_board');
    localStorage.removeItem('match3_config');
  };

  return (
    <GameContext.Provider value={{ initialBoard, initialConfig, startGame, clearGame }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
