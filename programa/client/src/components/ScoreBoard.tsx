/**
 * @file ScoreBoard.tsx
 * @description Componente que muestra la tabla de puntuaciones en tiempo real.
 * Resalta al usuario actual en la lista.
 */
import React from 'react';
import { JugadorData } from '../services/SocketService';

interface ScoreBoardProps {
  jugadores: JugadorData[];
  currentUserNickname: string;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ jugadores, currentUserNickname }) => {
  return (
    <div className="score-panel">
      <table className="score-table">
        <thead>
          <tr>
            <th className="score-header">Nombre</th>
            <th className="score-header">Puntaje</th>
          </tr>
        </thead>
        <tbody>
          {jugadores.map(j => (
            <tr
              key={j.socketID}
              className={j.nickname === currentUserNickname ? "current-user-row" : ""}
            >
              <td className="score-cell">
                {j.nickname}
                {j.conectado === false && <span title="Desconectado"> ⚠️</span>}
              </td>
              <td className="score-cell">{j.puntaje ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
