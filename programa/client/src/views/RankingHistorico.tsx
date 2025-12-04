// client/src/views/RankingHistorico.tsx

import React, { useState, useEffect } from 'react';
import './RankingHistorico.css';

// --- Interfaces de Tipos ---
interface JugadorRanking {
  rank: number;
  user: string;
  puntaje: number;
  tematica: string;
  tiempo: number;
  gameId: string;
}

interface RankingHistoricoProps {
  onBack: () => void; // Función para regresar al menú principal
}

export const RankingHistorico: React.FC<RankingHistoricoProps> = ({ onBack }) => {
  const [ranking, setRanking] = useState<JugadorRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const fetchEstadisticas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:4000/api/partida/ranking');
      const data = await response.json();

      if (data.ranking) {
        setRanking(data.ranking);
      } else {
        setRanking([]);
      }
      setLoading(false);

    } catch (e) {
      setError('Fallo de conexión con el servidor de Ranking.');
      console.error(e);
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="ranking-historico-container">
      {/* Fondo Animado */}
      <div className="ranking-historico-background" />

      {/* Partículas */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={`particle-${i}`}
          className="ranking-historico-particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${8 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      {/* Gemas decorativas */}
      <div className="gem gem-red" style={{ top: '8%', left: '10%', animationDelay: '0s' }}>💎</div>
      <div className="gem gem-blue" style={{ top: '15%', right: '12%', animationDelay: '0.8s' }}>💎</div>
      <div className="gem gem-green" style={{ bottom: '18%', left: '8%', animationDelay: '1.6s' }}>💎</div>
      <div className="gem gem-yellow" style={{ bottom: '12%', right: '15%', animationDelay: '2.4s' }}>💎</div>
      <div className="gem gem-purple" style={{ top: '50%', left: '5%', animationDelay: '3.2s' }}>💎</div>
      <div className="gem gem-orange" style={{ top: '45%', right: '8%', animationDelay: '4s' }}>💎</div>

      {/* Burbujas */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`bubble-${i}`}
          className="bubble"
          style={{
            left: `${10 + i * 12}%`,
            animationDuration: `${10 + Math.random() * 8}s`,
            animationDelay: `${i * 1.2}s`,
          }}
        />
      ))}

      {/* Botón de retroceso */}
      <button className="back-button" onClick={onBack}>
        ← Volver
      </button>

      {/* Card Principal */}
      <div className="ranking-historico-card">
        <h1 className="ranking-historico-title">🏆 Ranking Histórico 🏆</h1>

        {loading && <p className="loading-text">Cargando estadísticas...</p>}
        {error && <p className="error-text">Error: {error}</p>}

        {!loading && !error && ranking.length === 0 && (
          <p className="no-data-text">No hay estadísticas disponibles. ¡Juega algunas partidas!</p>
        )}

        {!loading && !error && ranking.length > 0 && (
          <div className="table-wrapper">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th className="table-header">Rank</th>
                  <th className="table-header">Partida</th>
                  <th className="table-header">Jugador</th>
                  <th className="table-header">Puntaje</th>
                  <th className="table-header">Temática</th>
                  <th className="table-header">Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((stat, index) => (
                  <tr
                    key={`${stat.gameId}-${index}`}
                    className="table-row"
                  >
                    <td className="table-cell">{stat.rank}</td>
                    <td className="table-cell partida-cell">{stat.gameId}</td>
                    <td className="table-cell ganador-cell">{stat.user}</td>
                    <td className="table-cell puntaje-cell">{stat.puntaje}</td>
                    <td className="table-cell">{stat.tematica}</td>
                    <td className="table-cell">{formatTime(stat.tiempo)}</td>
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