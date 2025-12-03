// client/src/views/RankingHistorico.tsx

import React, { useState, useEffect } from 'react';

// --- Interfaces de Tipos ---
interface JugadorRanking {
  rank: number;
  user: string;
  victorias: number;
}

interface RankingHistoricoProps {
  onBack: () => void; // Función para regresar al menú principal
}

export const RankingHistorico: React.FC<RankingHistoricoProps> = ({ onBack }) => {
  const [datosRanking, setDatosRanking] = useState<JugadorRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:4000/api/partida/ranking');
      const data = await response.json();

      if (data.ranking) {
        setDatosRanking(data.ranking);
      } else {
        setDatosRanking([]);
      }
      setLoading(false);

    } catch (e) {
      setError('Fallo de conexión con el servidor de Ranking.');
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div style={styles.windowFrame}>
      {/* Botón de retroceso */}
      <div style={styles.backButton} onClick={onBack}>
        &larr;
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>Ranking</h1>
      </div>

      <div style={styles.content}>

        {loading && <p style={styles.loadingText}>Cargando ranking...</p>}
        {error && <p style={styles.errorText}>Error: {error}</p>}

        {!loading && !error && datosRanking.length === 0 && (
          <p style={styles.noDataText}>No hay datos de ranking disponibles.</p>
        )}

        {!loading && !error && datosRanking.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>RANK</th>
                  <th style={styles.tableHeader}>User</th>
                  <th style={styles.tableHeader}>N° Victorias</th>
                </tr>
              </thead>
              <tbody>
                {datosRanking.map((jugador) => (
                  <tr
                    key={jugador.rank}
                    style={styles.tableRow}
                  >
                    <td style={{ ...styles.tableCell, ...styles.rankCell }}>{jugador.rank}</td>
                    <td style={styles.tableCell}>{jugador.user}</td>
                    <td style={styles.tableCell}>{jugador.victorias}</td>
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
    width: '450px', // Ancho ajustado para la tabla
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
    maxHeight: '350px', // Para el scroll
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
    padding: '10px',
    textAlign: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  tableRow: {
    transition: 'background-color 0.2s',
  },
  tableCell: {
    padding: '10px',
    borderBottom: '1px solid #444',
    textAlign: 'center',
  },
  rankCell: {
    fontWeight: 'bold',
    color: '#FF9800', // Color para resaltar el ranking
  }
};