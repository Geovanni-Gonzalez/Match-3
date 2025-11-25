// client/src/views/Juego.tsx

import React, { useState, useEffect } from 'react';

// --- Constantes del Juego ---
const FILAS = 9;
const COLUMNAS = 7;
const COLORES = ['#1E90FF', '#FF8C00', '#FF4500', '#32CD32', '#FFD700', '#8A2BE2', '#00CED1']; 

// --- Interfaces de Tipos ---
interface JugadorPartida {
  nickname: string;
  puntaje: number;
}

interface Celda {
  id: number;
  color: string;
}

interface JuegoProps {
  partidaId: string;
  currentUserNickname: string;
  initialTablero: Celda[][]; // <--- Recibe el tablero del servidor
  onLeave: () => void;
}

export const Juego: React.FC<JuegoProps> = ({ 
  partidaId, 
  currentUserNickname, 
  initialTablero, 
  onLeave 
}) => {
  // Inicializamos el tablero DIRECTAMENTE con lo que envía el servidor
  const [tablero, setTablero] = useState<Celda[][]>(initialTablero);
  
  const [jugadores, setJugadores] = useState<JugadorPartida[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null); 
  const [matchGoal, setMatchGoal] = useState<number>(100); 
  const [tiempoRestante, setTiempoRestante] = useState<number>(300); 

  // 1. Inicialización de Jugadores (Simulación por ahora)
  useEffect(() => {
    setJugadores([
      { nickname: 'Juan', puntaje: 100 },
      { nickname: currentUserNickname, puntaje: 65 },
      { nickname: 'Felipe', puntaje: 80 },
      { nickname: 'Andrés', puntaje: 45 },
    ].sort((a, b) => b.puntaje - a.puntaje)); 
  }, [currentUserNickname]);

  // 2. Cronómetro (Simulación)
  useEffect(() => {
    if (tiempoRestante > 0) {
      const timer = setInterval(() => {
        setTiempoRestante(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [tiempoRestante]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Manejo de selección
  const handleCellClick = (cellId: number) => {
    if (selectedCell === cellId) {
      setSelectedCell(null);
    } else {
      setSelectedCell(cellId);
      // Aquí iría la lógica de bloqueo visual para otros jugadores (Fase 3)
    }
  };

  // 4. Activar Match (Simulación local visual por ahora)
  const handleMatch = () => {
    if (selectedCell === null) {
      alert('Debes seleccionar al menos una celda.');
      return;
    }
    
    // Simulación de actualización
    setTimeout(() => {
        const newScore = jugadores.map(j => 
            j.nickname === currentUserNickname ? { ...j, puntaje: j.puntaje + 25 } : j
        ).sort((a, b) => b.puntaje - a.puntaje);
        
        setJugadores(newScore);
        setSelectedCell(null);
        
        // Actualización visual local (para la demo)
        setTablero(prev => prev.map(row => row.map(cell => {
            if (cell.id === selectedCell) {
                return { ...cell, color: COLORES[Math.floor(Math.random() * (COLORES.length - 1))] };
            }
            return cell;
        })));

    }, 500);
  };
  
  return (
    <div style={styles.windowFrame}>
        <h1 style={styles.title}>Juego: {partidaId.substring(0, 8)}...</h1>

        <div style={styles.goalHeader}>
            Matches: {matchGoal} / Tiempo: {formatTime(tiempoRestante)}
        </div>

        <div style={styles.gameArea}>
            <div style={styles.scorePanel}>
                <table style={styles.scoreTable}>
                    <thead>
                        <tr>
                            <th style={styles.scoreHeader}>Nombre</th>
                            <th style={styles.scoreHeader}>Puntaje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jugadores.map((jugador) => (
                            <tr 
                                key={jugador.nickname} 
                                style={jugador.nickname === currentUserNickname ? styles.currentUserRow : {}}
                            >
                                <td style={styles.scoreCell}>{jugador.nickname}</td>
                                <td style={styles.scoreCell}>{jugador.puntaje}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={styles.boardContainer}>
                <div style={styles.boardGrid}>
                    {tablero.flat().map((celda) => (
                        <div 
                            key={celda.id}
                            style={{
                                ...styles.cell,
                                backgroundColor: celda.color,
                                border: selectedCell === celda.id ? '3px solid #FFD700' : '1px solid #333',
                            }}
                            onClick={() => handleCellClick(celda.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
        
        <button onClick={handleMatch} style={styles.matchButton}>Match</button>
        <button onClick={onLeave} style={styles.leaveButton}>Abandonar Partida</button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  windowFrame: {
    padding: '30px',
    borderRadius: '10px',
    backgroundColor: '#333744',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
    width: 'fit-content', 
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'white',
  },
  title: {
    fontSize: '24px',
    color: '#61dafb',
    marginBottom: '10px',
  },
  goalHeader: {
    backgroundColor: '#444857',
    padding: '10px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: 'bold',
    fontSize: '18px',
    border: '1px solid #555',
  },
  gameArea: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  scorePanel: {
    width: '200px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#444857',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  },
  scoreTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  scoreHeader: {
    backgroundColor: '#61dafb', 
    color: '#222',
    padding: '10px',
    textAlign: 'left',
    fontSize: '16px',
    borderBottom: '2px solid #333744',
  },
  scoreCell: {
    padding: '8px 10px',
    textAlign: 'left',
    borderBottom: '1px solid #555',
  },
  currentUserRow: {
    backgroundColor: '#3A404F', 
    fontWeight: 'bold',
  },
  boardContainer: {
    backgroundColor: '#282c34',
    padding: '5px',
    borderRadius: '8px',
    boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
  },
  boardGrid: {
    display: 'grid',
    gridTemplateColumns: `repeat(${COLUMNAS}, 1fr)`,
    gridTemplateRows: `repeat(${FILAS}, 1fr)`,
    gap: '2px', 
  },
  cell: {
    width: '35px', 
    height: '35px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'transform 0.1s, border 0.1s',
  },
  matchButton: {
    padding: '12px 30px',
    backgroundColor: '#00CED1', 
    color: '#222',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
    marginTop: '10px',
    boxShadow: '0 4px #00A3A8',
  },
  leaveButton: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    backgroundColor: 'transparent',
    color: '#999',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
  }
};