// client/src/views/ResultadoPartida.tsx

import React from 'react';

// --- Interfaces de Tipos ---
interface ResultadoJugador {
  posicion: number;
  nickname: string;
  puntaje: number;
  isCurrentUser: boolean;
}

interface ResultadoPartidaProps {
  partidaId: string;
  resultados: ResultadoJugador[];
  onContinue: () => void; // Función para regresar al Menú Principal
}

export const ResultadoPartida: React.FC<ResultadoPartidaProps> = ({ 
  partidaId, 
  resultados, 
  onContinue 
}) => {

  // Ordenar resultados por posición (ya deberían venir ordenados, pero por seguridad)
  const resultadosOrdenados = [...resultados].sort((a, b) => a.posicion - b.posicion);
  const currentUserResult = resultadosOrdenados.find(r => r.isCurrentUser);
  
  return (
    <div style={styles.windowFrame}>
      
      <h1 style={styles.title}>Partida Terminada</h1>
      <p style={styles.subtitle}>ID: {partidaId.substring(0, 8)}...</p>

      {/* Mensaje de Resultado Personal */}
      {currentUserResult && (
          <div style={styles.personalResult}>
              <span style={styles.personalText}>Tu Posición: </span>
              <span style={styles.personalRank}>{currentUserResult.posicion}°</span>
          </div>
      )}

      {/* Tabla de Posiciones Finales */}
      <div style={styles.tableContainer}>
        <table style={styles.scoreTable}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Posición</th>
              <th style={styles.tableHeader}>Nombre</th>
              <th style={styles.tableHeader}>Puntaje</th>
            </tr>
          </thead>
          <tbody>
            {resultadosOrdenados.map((resultado) => (
              <tr 
                key={resultado.nickname} 
                style={resultado.isCurrentUser ? styles.currentUserRow : {}}
              >
                <td style={{...styles.tableCell, ...styles.positionCell}}>{resultado.posicion}°</td>
                <td style={styles.tableCell}>{resultado.nickname}</td>
                <td style={styles.tableCell}>{resultado.puntaje}</td>
              </tr>
            ))}
            
            {/* Simulación de filas vacías para completar el espacio visual */}
            {Array(6 - resultadosOrdenados.length).fill(0).map((_, index) => (
                <tr key={`empty-${index}`}>
                    <td style={{...styles.tableCell, color: '#666'}}>...</td>
                    <td style={{...styles.tableCell, color: '#666'}}>...</td>
                    <td style={{...styles.tableCell, color: '#666'}}>...</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Botón Continuar */}
      <button 
        onClick={onContinue}
        style={styles.continueButton}
      >
        Continuar
      </button>

    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  windowFrame: {
    padding: '30px',
    borderRadius: '10px',
    backgroundColor: '#333744',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
    width: '400px', 
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'white',
  },
  title: {
    fontSize: '32px',
    color: '#61dafb',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#aaa',
    marginBottom: '20px',
  },
  personalResult: {
    backgroundColor: '#4CAF50',
    padding: '10px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#222',
    fontWeight: 'bold',
    width: '80%',
    textAlign: 'center',
  },
  personalText: {
    marginRight: '10px',
  },
  personalRank: {
    fontSize: '20px',
  },
  tableContainer: {
    width: '100%',
    backgroundColor: '#444857',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    marginBottom: '30px',
  },
  scoreTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#2C3E50', // Azul oscuro
    color: 'white',
    padding: '12px 10px',
    textAlign: 'center',
    fontSize: '16px',
    borderBottom: '2px solid #333744',
  },
  tableCell: {
    padding: '10px 10px',
    textAlign: 'center',
    borderBottom: '1px solid #555',
    fontSize: '15px',
    fontWeight: '500',
  },
  positionCell: {
    fontWeight: 'bold',
    fontSize: '18px',
  },
  currentUserRow: {
    backgroundColor: '#3A404F', // Resaltar fila del usuario actual
    fontWeight: 'bold',
    color: '#FFD700', // Texto dorado para el usuario
  },
  continueButton: {
    padding: '15px 40px',
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
    boxShadow: '0 4px #CD7900',
    },
};