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
      
      <h1 className="resultado-title">Partida Terminada</h1>
      <p className="resultado-subtitle">ID: {partidaId.substring(0, 8)}... | Tema: {tematica || 'N/A'}</p>

      {/* Mensaje de Resultado Personal */}
      {currentUserResult && (
          <div className="personal-result">
              <span className="personal-text">Tu Posición: </span>
              <span className="personal-rank">{currentUserResult.posicion}°</span>
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
            {resultadosOrdenados.map((resultado) => (
              <tr 
                key={resultado.nickname} 
                className={resultado.isCurrentUser ? "current-user-row" : ""}
              >
                <td className="table-cell position-cell">{resultado.posicion}°</td>
                <td className="table-cell">{resultado.nickname}</td>
                <td className="table-cell">{resultado.puntaje}</td>
              </tr>
            ))}
            
            {/* Simulación de filas vacías para completar el espacio visual */}
            {Array(6 - resultadosOrdenados.length).fill(0).map((_, index) => (
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
      >
        Continuar
      </button>

    </div>
  );
};
