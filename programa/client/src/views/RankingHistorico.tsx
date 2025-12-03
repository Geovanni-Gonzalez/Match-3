// client/src/views/RankingHistorico.tsx

import React, { useState, useEffect } from 'react';

// --- Interfaces de Tipos ---
interface EstadisticaPartida {
  partidaId: string;
  ganador: string;
  puntaje: number;
  tematica: string;
  tiempoInvertidoSegundos: number;
  fecha: string;
}

interface RankingHistoricoProps {
  onBack: () => void; // Función para regresar al menú principal
}

export const RankingHistorico: React.FC<RankingHistoricoProps> = ({ onBack }) => {
  const [estadisticas, setEstadisticas] = useState<EstadisticaPartida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const fetchEstadisticas = async () => {
    setLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/estadisticas`);
      
      if (!response.ok) {
        throw new Error('Error al obtener estadísticas');
      }
      
      const data = await response.json();
      
      if (data.success && data.estadisticas) {
        // Ordenar por puntaje descendente
        const estadisticasOrdenadas = data.estadisticas.sort((a: EstadisticaPartida, b: EstadisticaPartida) => b.puntaje - a.puntaje);
        setEstadisticas(estadisticasOrdenadas);
      }
      
      setLoading(false);
    } catch (e) {
      setError('Fallo de conexión con el servidor de Ranking.');
      console.error(e);
      setLoading(false);
    } 
  };

  const formatTiempo = (segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins}m ${segs}s`;
  };

  return (
    <div style={styles.windowFrame}>
      {/* Botón de retroceso */}
      <div style={styles.backButton} onClick={onBack}>
        &larr;
      </div>
      
      <div style={styles.header}>
        <h1 style={styles.title}>Ranking Histórico</h1>
      </div>

      <div style={styles.content}>
        
        {loading && <p style={styles.loadingText}>Cargando estadísticas...</p>}
        {error && <p style={styles.errorText}>Error: {error}</p>}

        {!loading && !error && estadisticas.length === 0 && (
          <p style={styles.noDataText}>No hay estadísticas disponibles. ¡Juega algunas partidas!</p>
        )}

        {!loading && !error && estadisticas.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Partida</th>
                  <th style={styles.tableHeader}>Ganador</th>
                  <th style={styles.tableHeader}>Puntaje</th>
                  <th style={styles.tableHeader}>Temática</th>
                  <th style={styles.tableHeader}>Tiempo</th>
                  <th style={styles.tableHeader}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.map((stat, index) => (
                  <tr 
                    key={`${stat.partidaId}-${index}`}
                    style={styles.tableRow}
                  >
                    <td style={{ ...styles.tableCell, ...styles.partidaCell }}>{stat.partidaId}</td>
                    <td style={{ ...styles.tableCell, ...styles.ganadorCell }}>{stat.ganador}</td>
                    <td style={{ ...styles.tableCell, ...styles.puntajeCell }}>{stat.puntaje}</td>
                    <td style={styles.tableCell}>{stat.tematica}</td>
                    <td style={styles.tableCell}>{formatTiempo(stat.tiempoInvertidoSegundos)}</td>
                    <td style={styles.tableCell}>{stat.fecha}</td>
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

const styles: { [key: string]: React.CSSProperties } = {
  windowFrame: {
    padding: '20px',
    borderRadius: '10px',
    backgroundColor: '#333744',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
    width: '800px', // Ancho aumentado para más columnas
    maxHeight: '90vh',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'white',
  },
  backButton: {
    position: 'absolute',
    top: '15px',
    left: '15px',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: '5px',
    color: '#61dafb',
  },
  header: {
    width: '100%',
    textAlign: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    color: '#61dafb',
    margin: '0',
  },
  content: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 20px',
  },
  loadingText: {
    color: '#61dafb',
    margin: '20px 0',
  },
  errorText: {
    color: '#ff6b6b',
    margin: '20px 0',
  },
  noDataText: {
    color: '#ccc',
    margin: '20px 0',
  },
  tableWrapper: {
    width: '100%',
    maxHeight: '500px', // Para el scroll
    overflowY: 'auto',
    border: '1px solid #555',
    borderRadius: '5px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#4CAF50', // Color verde
    color: 'white',
    padding: '12px',
    textAlign: 'center',
    position: 'sticky', 
    top: 0,
    zIndex: 1,
    fontSize: '14px',
    fontWeight: 'bold',
  },
  tableRow: {
    transition: 'background-color 0.2s',
    cursor: 'default',
  },
  tableCell: {
    padding: '10px',
    borderBottom: '1px solid #444',
    textAlign: 'center',
    fontSize: '13px',
  },
  partidaCell: {
    fontWeight: 'bold',
    color: '#61dafb',
  },
  ganadorCell: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
  puntajeCell: {
    fontWeight: 'bold',
    color: '#4CAF50',
  }
};