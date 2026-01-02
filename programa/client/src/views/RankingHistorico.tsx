/**
 * @file RankingHistorico.tsx
 * @description Vista de ranking histórico de partidas finalizadas.
 * 
 * Muestra una tabla con:
 * - Nombre del ganador.
 * - Puntaje obtenido.
 * - Temática y duración.
 * - Fecha de la partida.
 * 
 * Consulta la API REST del servidor para obtener los datos históricos.
 */

import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

import '../styles/RankingHistorico.css';
import { Logger } from '../utils/Logger';
import { Background } from '../components/Background';

// --- Interfaces de Tipos ---

/** Datos de una entrada del ranking. */
interface JugadorRanking {
  rank: number;
  user: string;
  puntaje: number;
  tematica: string;
  tiempo: number;
  gameId: string;
  fecha: string;
}

interface RankingHistoricoProps {
  /** Función para regresar al menú principal. */
  onBack: () => void;
}

/**
 * Componente de vista del ranking histórico.
 */
export const RankingHistorico: React.FC<RankingHistoricoProps> = ({ onBack }) => {
  const [estadisticas, setEstadisticas] = useState<JugadorRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const fetchEstadisticas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/partida/ranking`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();

      if (data.ranking) {
        setEstadisticas(data.ranking);
      } else {
        setEstadisticas([]);
      }
      setLoading(false);

    } catch (e) {
      setError('Fallo de conexión con el servidor de Ranking.');
      Logger.error(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="ranking-historico-container">
      <Background />

      {/* Botón de retroceso */}
      <button className="back-button" onClick={onBack}>
        ← Volver
      </button>

      {/* Card Principal */}
      <div className="ranking-historico-card">
        <h1 className="ranking-historico-title">🏆 Ranking Histórico 🏆</h1>

        {loading && <p className="loading-text">Cargando estadísticas...</p>}
        {error && <p className="error-text">Error: {error}</p>}

        {!loading && !error && estadisticas.length === 0 && (
          <p className="no-data-text">No hay estadísticas disponibles. ¡Juega algunas partidas!</p>
        )}

        {!loading && !error && estadisticas.length > 0 && (
          <div className="table-wrapper">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th className="table-header">Partida</th>
                  <th className="table-header">Ganador</th>
                  <th className="table-header">Puntaje</th>
                  <th className="table-header">Temática</th>
                  <th className="table-header">Tiempo</th>
                  <th className="table-header">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.map((stat, index) => (
                  <tr 
                    key={`${stat.gameId}-${index}`}
                    className="table-row"
                  >
                    <td className="table-cell partida-cell">{stat.gameId}</td>
                    <td className="table-cell ganador-cell">{stat.user}</td>
                    <td className="table-cell puntaje-cell">{stat.puntaje}</td>
                    <td className="table-cell">{stat.tematica}</td>
                    <td className="table-cell">{formatTime(stat.tiempo)}</td>
                    <td className="table-cell">{formatDate(stat.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingHistorico;