// client/src/views/Juego.tsx

import React, { useState, useEffect } from 'react';

// --- Constantes del Juego ---
const FILAS = 9;
const COLUMNAS = 7;
const COLORES = ['#1E90FF', '#FF8C00', '#FF4500', '#32CD32', '#FFD700', '#8A2BE2', '#00CED1']; // Azul, Naranja, Rojo, Verde, Amarillo, Morado, Celdas Vacias

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
  onLeave: () => void; // Función para abandonar la partida
}

export const Juego: React.FC<JuegoProps> = ({ partidaId, currentUserNickname, onLeave }) => {
  const [tablero, setTablero] = useState<Celda[][]>([]);
  const [jugadores, setJugadores] = useState<JugadorPartida[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null); // ID de la celda seleccionada por el usuario
  const [matchGoal, setMatchGoal] = useState<number>(100); // Meta de matches para el modo Vs
  const [tiempoRestante, setTiempoRestante] = useState<number>(300); // 5 minutos = 300 segundos para modo Vs Tiempo

  // 1. Inicialización del Tablero (9x7 con colores aleatorios)
  useEffect(() => {
    const initialTablero: Celda[][] = Array.from({ length: FILAS }, (_, filaIndex) =>
      Array.from({ length: COLUMNAS }, (_, colIndex) => {
        const id = filaIndex * COLUMNAS + colIndex;
        const colorIndex = Math.floor(Math.random() * (COLORES.length - 1)); // -1 para evitar la celda vacía
        return { id, color: COLORES[colorIndex] };
      })
    );
    setTablero(initialTablero);

    // Mock de jugadores y puntajes (simulación en tiempo real)
    setJugadores([
      { nickname: 'Juan', puntaje: 100 },
      { nickname: currentUserNickname, puntaje: 65 },
      { nickname: 'Felipe', puntaje: 80 },
      { nickname: 'Andrés', puntaje: 45 },
    ].sort((a, b) => b.puntaje - a.puntaje)); // Ordenar por puntaje (desc)
  }, [currentUserNickname]);

  // 2. Cronómetro/Contador (Simulación)
  useEffect(() => {
    if (tiempoRestante > 0) {
      const timer = setInterval(() => {
        setTiempoRestante(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [tiempoRestante]);

  // Formatear tiempo (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Manejo de la selección de celda (REQ: clic en celda)
  const handleCellClick = (cellId: number) => {
    // Si la celda ya está seleccionada por este usuario, deseleccionar
    if (selectedCell === cellId) {
      setSelectedCell(null);
      console.log('Deseleccionando celda:', cellId);
    } else {
      // Simular el envío al servidor: POST /api/partidas/{id}/select
      setSelectedCell(cellId);
      console.log('Celda seleccionada por (Tú):', cellId);
    }
    // En un juego real, la lógica de bloqueo de otros jugadores se manejaría por el servidor
  };

  // 4. Activar la combinación (REQ: Botón 'Match')
  const handleMatch = () => {
    if (selectedCell === null) {
      alert('Debes seleccionar al menos una celda para intentar un Match.');
      return;
    }
    // Simular el envío al servidor: POST /api/partidas/{id}/match
    console.log('Activando Match en el servidor...');
    
    // Simular el resultado: Match exitoso (puntos) y reinicio de la selección
    setTimeout(() => {
        const newScore = jugadores.map(j => 
            j.nickname === currentUserNickname ? { ...j, puntaje: j.puntaje + 25 } : j
        ).sort((a, b) => b.puntaje - a.puntaje);
        
        setJugadores(newScore);
        setSelectedCell(null);
        // Regenerar tablero de forma simulada
        setTablero(tablero.map(row => row.map(cell => ({
            ...cell,
            color: COLORES[Math.floor(Math.random() * (COLORES.length - 1))]
        }))));

    }, 500);
  };
  
  return (
    <div style={styles.windowFrame}>
        <h1 style={styles.title}>Juego: {partidaId.substring(0, 8)}...</h1>

        {/* Header de Metas (Matches / Tiempo) */}
        <div style={styles.goalHeader}>
            {/* Simulación: Matches pendientes (Modo Vs) o Tiempo restante (Modo Vs Tiempo) */}
            Matches: {matchGoal} / Tiempo: {formatTime(tiempoRestante)}
        </div>

        <div style={styles.gameArea}>
            
            {/* 1. Panel de Jugadores y Puntajes */}
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

            {/* 2. Área del Tablero de Juego (Matriz 9x7) */}
            <div style={styles.boardContainer}>
                <div style={styles.boardGrid}>
                    {tablero.flat().map((celda) => (
                        <div 
                            key={celda.id}
                            style={{
                                ...styles.cell,
                                backgroundColor: celda.color,
                                // Resaltar celda seleccionada por el usuario
                                border: selectedCell === celda.id ? '3px solid #FFD700' : '1px solid #333',
                            }}
                            onClick={() => handleCellClick(celda.id)}
                        >
                            {/* Aquí se podrían renderizar las figuras o gemas si la temática fuera más compleja */}
                        </div>
                    ))}
                </div>
            </div>
            
        </div>
        
        {/* Botón de Acción (Match) */}
        <button 
          onClick={handleMatch}
          style={styles.matchButton}
        >
          Match
        </button>

        {/* Botón de Abandono (Oculto, solo para salir de la vista) */}
        <button 
          onClick={onLeave} 
          style={styles.leaveButton}
        >
          Abandonar Partida
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
    width: 'fit-content', // Ajustar al contenido
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
  // --- Panel de Puntajes ---
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
    backgroundColor: '#61dafb', // Color azul
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
    backgroundColor: '#3A404F', // Resaltar al usuario actual
    fontWeight: 'bold',
  },
  // --- Tablero de Juego ---
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
    gap: '2px', // Espacio entre las celdas
  },
  cell: {
    width: '35px', // Tamaño de la celda
    height: '35px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'transform 0.1s, border 0.1s',
  },
  // --- Botones ---
  matchButton: {
    padding: '12px 30px',
    backgroundColor: '#00CED1', // Turquesa (similar al wireframe)
    color: '#222',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s, transform 0.1s',
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