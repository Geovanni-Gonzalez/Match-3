import React, { createContext, useContext, useState, ReactNode } from 'react';
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

  const startGame = (board: Celda[][], config: GameConfig) => {
    setInitialBoard(board);
    setInitialConfig(config);
  };

  const clearGame = () => {
    setInitialBoard(null);
    setInitialConfig(null);
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
