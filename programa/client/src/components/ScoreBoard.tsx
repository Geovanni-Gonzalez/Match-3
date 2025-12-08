/**
 * @file ScoreBoard.tsx
 * @description Componente que muestra la tabla de puntuaciones en tiempo real.
 * Resalta al usuario actual en la lista.
 */
import React, { useEffect, useRef } from 'react';
import { JugadorData } from '../services/SocketService';
import '../styles/ScoreBoard.css';

interface ScoreBoardProps {
  jugadores: JugadorData[];
  currentUserNickname: string;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ jugadores, currentUserNickname }) => {
  // Ordenar jugadores por puntaje (descendente)
  const sortedJugadores = [...jugadores].sort((a, b) => (b.puntaje ?? 0) - (a.puntaje ?? 0));

  // Ref para detectar cambios en puntajes
  const prevScoresRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Actualizar scores previos
    const newScores = new Map<string, number>();
    sortedJugadores.forEach(j => {
      newScores.set(j.socketID, j.puntaje ?? 0);
    });
    prevScoresRef.current = newScores;
  }, [sortedJugadores]);

  /**
   * Obtiene el icono de medalla según la posición
   */
  const getRankMedal = (index: number): string => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '';
    }
  };

  /**
   * Verifica si el puntaje cambió recientemente
   */
  const hasScoreChanged = (socketID: string, currentScore: number): boolean => {
    const prevScore = prevScoresRef.current.get(socketID);
    return prevScore !== undefined && prevScore !== currentScore;
  };

  return (
    <div className="score-panel" role="region" aria-label="Tabla de puntuaciones">
      <div className="score-header-container">
        <h2 className="score-title">🏆 Ranking</h2>
      </div>

      <table className="score-table">
        <thead>
          <tr>
            <th className="score-header" scope="col">Pos</th>
            <th className="score-header" scope="col">Jugador</th>
            <th className="score-header" scope="col">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {sortedJugadores.map((j, index) => {
            const isCurrentUser = j.nickname === currentUserNickname;
            const medal = getRankMedal(index);
            const scoreChanged = hasScoreChanged(j.socketID, j.puntaje ?? 0);

            return (
              <tr
                key={j.socketID}
                className={`score-row ${isCurrentUser ? "current-user-row" : ""}`}
                aria-current={isCurrentUser ? "true" : undefined}
              >
                <td className="score-cell rank-cell">
                  {medal || `${index + 1}°`}
                </td>
                <td className="score-cell name-cell">
                  <span className="player-name">{j.nickname}</span>
                  {j.conectado === false && (
                    <span
                      className="disconnect-icon"
                      title="Desconectado"
                      aria-label="Jugador desconectado"
                    >
                      ⚠️
                    </span>
                  )}
                  {isCurrentUser && (
                    <span
                      className="you-badge"
                      aria-label="Tú"
                    >
                      TÚ
                    </span>
                  )}
                </td>
                <td className={`score-cell points-cell ${scoreChanged ? 'score-updating' : ''}`}>
                  {j.puntaje ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
