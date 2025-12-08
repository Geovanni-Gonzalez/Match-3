/**
 * @file ResultadoPartida.tsx
 * @description Vista de resultados finales de la partida.
 * 
 * Muestra:
 * - Tabla con las posiciones finales de todos los jugadores.
 * - Resalta la posición del usuario actual.
 * - Botón para regresar al menú principal.
 */

import React from 'react';
import '../styles/ResultadoPartida.css';

// --- Interfaces de Tipos ---

/** Resultado individual de un jugador. */
interface ResultadoJugador {
  posicion: number;
  nickname: string;
  puntaje: number;
  isCurrentUser: boolean;
}

interface ResultadoPartidaProps {
  /** ID de la partida finalizada. */
  partidaId: string;
  /** Lista de resultados de los jugadores ordenada por posición. */
  resultados: ResultadoJugador[];
  /** Función para regresar al menú principal. */
  onContinue: () => void;
  /** Temática de la partida (opcional). */
  tematica?: string;
}

/**
 * Componente de vista de resultados de la partida.
 */
export const ResultadoPartida: React.FC<ResultadoPartidaProps> = ({
  partidaId,
  resultados,
  onContinue,
  tematica
}) => {

  // Ordenar resultados por posición (ya deberían venir ordenados, pero por seguridad)
  const resultadosOrdenados = [...resultados].sort((a, b) => a.posicion - b.posicion);
  const currentUserResult = resultadosOrdenados.find(r => r.isCurrentUser);

  return (
    <div className="resultado-container">
      {/* Fondo animado con gradiente */}
      <div className="resultado-background"></div>

      {/* Partículas flotantes */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="resultado-particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${8 + Math.random() * 12}s`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}

      {/* Gemas decorativas */}
      <div className="gem gem-red" style={{ top: '8%', left: '10%', animationDelay: '0s' }}>💎</div>
      <div className="gem gem-blue" style={{ top: '15%', right: '12%', animationDelay: '1s' }}>💎</div>
      <div className="gem gem-green" style={{ bottom: '18%', left: '8%', animationDelay: '2s' }}>💎</div>
      <div className="gem gem-yellow" style={{ top: '45%', left: '5%', animationDelay: '1.5s' }}>💎</div>
      <div className="gem gem-purple" style={{ bottom: '25%', right: '10%', animationDelay: '2.5s' }}>💎</div>
      <div className="gem gem-orange" style={{ top: '60%', right: '7%', animationDelay: '0.8s' }}>💎</div>

      <div className="resultado-card">
        <h1 className="resultado-title">Partida Terminada</h1>
        <p className="resultado-subtitle">ID: {partidaId.substring(0, 8)}... | Tema: {tematica || 'N/A'}</p>

        {/* Mensaje de Resultado Personal */}
        {currentUserResult && (
          <div className="personal-result" role="status" aria-live="polite">
            <span className="personal-icon">
              {currentUserResult.posicion === 1 ? '🏆' : currentUserResult.posicion <= 3 ? '🎉' : '🎯'}
            </span>
            <span className="personal-text">Tu Posición: </span>
            <span className="personal-rank">{currentUserResult.posicion}°</span>
            <span className="personal-score">{currentUserResult.puntaje} pts</span>
          </div>
        )}

        {/* Tabla de Posiciones Finales */}
        <div className="table-container">
          <table className="score-table">
            <thead>
              <tr>
                <th className="table-header">Posición</th>
                <th className="table-header">Nombre</th>
                <th className="table-header">Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {resultadosOrdenados.map((resultado, index) => (
                <tr
                  key={resultado.nickname}
                  className={`score-row ${resultado.isCurrentUser ? "current-user-row" : ""}`}
                  style={{ animationDelay: `${0.1 * index}s` }}
                  aria-current={resultado.isCurrentUser ? "true" : undefined}
                >
                  <td className="table-cell position-cell">
                    {resultado.posicion === 1 && <span className="winner-crown">👑</span>}
                    {resultado.posicion === 1 ? '🥇' : resultado.posicion === 2 ? '🥈' : resultado.posicion === 3 ? '🥉' : `${resultado.posicion}°`}
                  </td>
                  <td className="table-cell name-cell">
                    {resultado.nickname}
                    {resultado.isCurrentUser && <span className="you-badge">TÚ</span>}
                  </td>
                  <td className="table-cell score-cell">{resultado.puntaje}</td>
                </tr>
              ))}

              {/* Simulación de filas vacías para completar el espacio visual */}
              {Array(Math.max(0, 6 - resultadosOrdenados.length)).fill(0).map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td className="table-cell empty-cell">...</td>
                  <td className="table-cell empty-cell">...</td>
                  <td className="table-cell empty-cell">...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Botón Continuar */}
        <button
          onClick={onContinue}
          className="continue-button"
          aria-label="Volver al menú principal"
        >
          ✨ Continuar
        </button>
      </div>
    </div>
  );
};
