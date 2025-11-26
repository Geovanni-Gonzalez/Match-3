// client/src/views/Juego.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// --- Constantes ---
const FILAS = 9;
const COLUMNAS = 7;

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
  initialTablero: Celda[][];
  initialPlayers: JugadorPartida[];
  onLeave: () => void;
}

export const Juego: React.FC<JuegoProps> = ({ 
  partidaId, 
  currentUserNickname, 
  initialTablero,
  initialPlayers,
  onLeave 
}) => {
  const { socket } = useAuth(); 
  
  const [tablero, setTablero] = useState<Celda[][]>(initialTablero || []);
  const [jugadores, setJugadores] = useState<JugadorPartida[]>(initialPlayers || []);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [blockedCells, setBlockedCells] = useState<{ [id: number]: string }>({});
  const [matchGoal, setMatchGoal] = useState<number>(100); 
  const [tiempoRestante, setTiempoRestante] = useState<number>(300); 

  if (!tablero || tablero.length === 0) {
    return <div style={styles.windowFrame}><h1>Cargando partida...</h1></div>;
  }

  useEffect(() => {
    if (!socket) return;

    // --- ESCUCHAR ACTUALIZACIONES DEL JUEGO (REQ-029) ---
    socket.on('game_update', (data) => {
        console.log('[Client] Actualización recibida:', data);
        setTablero(data.tablero);       // Nuevo tablero
        setJugadores(data.jugadores);   // Nuevos puntajes
        
        // Si yo hice el match, limpio mi selección
        if (selectedCell !== null) {
            setSelectedCell(null);
        }
    });

    socket.on('match_failed', (data) => {
        alert(data.message); // Aviso si no es grupo de 3
    });

    socket.on('cell_locked', ({ cellId, lockedBy }) => {
        setBlockedCells(prev => ({ ...prev, [cellId]: lockedBy }));
    });

    socket.on('cell_unlocked', ({ cellId }) => {
        setBlockedCells(prev => {
            const newState = { ...prev };
            delete newState[cellId];
            return newState;
        });
    });

    return () => {
        socket.off('game_update');
        socket.off('match_failed');
        socket.off('cell_locked');
        socket.off('cell_unlocked');
    };
  }, [socket, selectedCell]);

  // Cronómetro
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

  const handleCellClick = (cellId: number) => {
    if (blockedCells[cellId]) return;

    if (selectedCell === cellId) {
      setSelectedCell(null);
      socket?.emit('deselect_cell', { partidaId, cellId });
    } else {
      if (selectedCell !== null) {
          socket?.emit('deselect_cell', { partidaId, cellId: selectedCell });
      }
      setSelectedCell(cellId);
      socket?.emit('select_cell', { partidaId, cellId, nickname: currentUserNickname });
    }
  };

  // --- MATCH REAL (REQ-024, REQ-025) ---
  const handleMatch = () => {
    if (selectedCell === null) {
      alert('Debes seleccionar una celda para intentar un Match.');
      return;
    }
    
    // En lugar de calcular localmente, le pedimos al servidor que lo intente
    console.log('[Client] Solicitando match en celda:', selectedCell);
    socket?.emit('attempt_match', { 
        partidaId, 
        cellId: selectedCell, 
        nickname: currentUserNickname 
    });
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
                        {jugadores
                           .sort((a, b) => b.puntaje - a.puntaje) // Ordenar por puntaje
                           .map((jugador) => (
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
                    {tablero.flat().map((celda) => {
                        const isBlocked = !!blockedCells[celda.id];
                        const lockedBy = blockedCells[celda.id];
                        return (
                            <div 
                                key={celda.id}
                                style={{
                                    ...styles.cell,
                                    backgroundColor: celda.color,
                                    border: selectedCell === celda.id 
                                        ? '3px solid #FFD700' 
                                        : isBlocked 
                                            ? '3px solid #FF4500' 
                                            : '1px solid #333',
                                    opacity: isBlocked ? 0.5 : 1,
                                    cursor: isBlocked ? 'not-allowed' : 'pointer',
                                    transform: selectedCell === celda.id ? 'scale(0.9)' : 'scale(1)'
                                }}
                                onClick={() => handleCellClick(celda.id)}
                                title={isBlocked ? `Bloqueada por ${lockedBy}` : ''}
                            >
                                {isBlocked && <span style={styles.lockIcon}>🔒</span>}
                            </div>
                        );
                    })}
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
  title: { fontSize: '24px', color: '#61dafb', marginBottom: '10px' },
  goalHeader: { backgroundColor: '#444857', padding: '10px 20px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', fontSize: '18px', border: '1px solid #555' },
  gameArea: { display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' },
  scorePanel: { width: '200px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#444857', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' },
  scoreTable: { width: '100%', borderCollapse: 'collapse' },
  scoreHeader: { backgroundColor: '#61dafb', color: '#222', padding: '10px', textAlign: 'left', fontSize: '16px', borderBottom: '2px solid #333744' },
  scoreCell: { padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #555' },
  currentUserRow: { backgroundColor: '#3A404F', fontWeight: 'bold' },
  boardContainer: { backgroundColor: '#282c34', padding: '5px', borderRadius: '8px', boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)' },
  boardGrid: { display: 'grid', gridTemplateColumns: `repeat(${COLUMNAS}, 1fr)`, gridTemplateRows: `repeat(${FILAS}, 1fr)`, gap: '2px' },
  cell: { 
      width: '35px', height: '35px', borderRadius: '4px', cursor: 'pointer', 
      transition: 'transform 0.1s, border 0.1s, opacity 0.2s',
      display: 'flex', justifyContent: 'center', alignItems: 'center' 
  },
  lockIcon: { fontSize: '12px' },
  matchButton: { padding: '12px 30px', backgroundColor: '#00CED1', color: '#222', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', transition: 'background-color 0.2s', marginTop: '10px', boxShadow: '0 4px #00A3A8' },
  leaveButton: { position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'transparent', color: '#999', border: 'none', fontSize: '12px', cursor: 'pointer' }
};