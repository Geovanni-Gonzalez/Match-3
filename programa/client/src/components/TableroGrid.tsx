/**
 * @file TableroGrid.tsx
 * @description Componente que renderiza la cuadrícula del tablero de juego.
 * Muestra las celdas con sus iconos correspondientes según la temática y
 * gestiona visualmente los estados de selección y bloqueo.
 */
import React from 'react';
import '../styles/TableroGrid.css';

// Mapeo de temáticas a iconos/emojis
const THEME_ICONS: Record<string, Record<string, string>> = {
  'Gemas': {
    red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', purple: '🟣', orange: '🟠'
  },
  'Animales': {
    red: '🐞', blue: '🐳', green: '🐸', yellow: '🐝', purple: '🦄', orange: '🦊'
  },
  'Frutas': {
    red: '🍎', blue: '🫐', green: '🥝', yellow: '🍌', purple: '🍇', orange: '🍊'
  },
  'Monstruos': {
    red: '👹', blue: '👾', green: '🧟', yellow: '💀', purple: '👿', orange: '🎃'
  }
};

interface TableroGridProps {
  tablero: any[][];
  onCellClick: (r: number, c: number) => void;
  gameStatus: string;
  mySocketId?: string;
  theme?: string;
}

export const TableroGrid: React.FC<TableroGridProps> = ({
  tablero,
  onCellClick,
  gameStatus,
  mySocketId,
  theme = 'Gemas'
}) => {
  return (
    <div className="board-container">
      <div
        className="board-grid"
        style={{
          gridTemplateRows: `repeat(${tablero.length}, 1fr)`,
          gridTemplateColumns: `repeat(${tablero[0].length}, 1fr)`
        }}
      >
        {tablero.map((row, r) =>
          row.map((celda, c) => {
            const isPropia = celda.seleccionadoPor === mySocketId;
            const isOtro = celda.seleccionadoPor && celda.seleccionadoPor !== mySocketId;

            // Determinar icono según temática
            const iconSet = THEME_ICONS[theme] || THEME_ICONS['Gemas'];
            const icon = iconSet[celda.colorID] || celda.colorID;

            return (
              <div
                key={`${r}-${c}`}
                className={`cell ${isPropia ? 'locked-by-me' : ''} ${isOtro ? 'locked-by-other' : ''}`}
                style={{
                  cursor: gameStatus === "active" ? "pointer" : "default"
                }}
                onClick={() => onCellClick(r, c)}
              >
                <span className="cell-content">{icon}</span>
                {isOtro && <div className="lock-icon">🔒</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
