// client/src/views/Juego.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// --- Constantes ---
const FILAS = 9;
const COLUMNAS = 7;

// Mapeo de colores del servidor a CSS
const COLOR_MAP: { [key: string]: string } = {
  'azul': '#1E90FF',      // DodgerBlue
  'naranja': '#FF8C00',   // DarkOrange
  'rojo': '#DC143C',      // Crimson
  'verde': '#32CD32',     // LimeGreen
  'amarillo': '#FFD700',  // Gold
  'morado': '#9370DB'     // MediumPurple
};

interface JugadorPartida {
  nickname: string;
  puntaje: number;
}

interface Celda {
  fila: number;
  columna: number;
  colorID: string;
  estado: string;
  bloqueadaPor: string | null;
}

interface JuegoProps {
  partidaId: string;
  currentUserNickname: string;
  initialTablero: Celda[][];
  initialPlayers: JugadorPartida[];
  gameInfo: { tipoJuego: string; tematica: string; duracionMinutos?: number };
  onLeave: () => void;
}

export const Juego: React.FC<JuegoProps> = ({ 
  partidaId, 
  currentUserNickname, 
  initialTablero,
  initialPlayers,
  gameInfo,
  onLeave 
}) => {
  const { socket } = useAuth(); 
  
  console.log('[Juego] Recibido initialTablero:', initialTablero);
  console.log('[Juego] Tipo de juego:', gameInfo.tipoJuego);
  console.log('[Juego] Temática:', gameInfo.tematica);
  
  const [tablero, setTablero] = useState<Celda[][]>(initialTablero || []);
  const [jugadores, setJugadores] = useState<JugadorPartida[]>(initialPlayers || []);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<{fila: number, columna: number}[]>([]);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  // Configurar según tipo de juego
  const [tiempoRestante, setTiempoRestante] = useState<number>(
    gameInfo.tipoJuego === 'Tiempo' && gameInfo.duracionMinutos 
      ? gameInfo.duracionMinutos * 60 
      : 0
  );

  useEffect(() => {
    if (!socket) return;

    // --- GRUPO BLOQUEADO: Cuando alguien selecciona un grupo ---
    socket.on('grupo_bloqueado', (data) => {
        console.log('[Client] Grupo bloqueado:', data);
        console.log('[Client] Bloqueado por:', data.nickname);
        console.log('[Client] Usuario actual:', currentUserNickname);
        
        // Actualizar tablero con el estado del servidor
        if (data.tablero) {
            setTablero(data.tablero);
        }
        
        // Si soy yo quien lo bloqueó, guardar el grupo
        if (data.nickname === currentUserNickname) {
            setGrupoSeleccionado(data.grupo);
        }
    });

    // --- GRUPO LIBERADO: Cuando alguien cancela ---
    socket.on('grupo_liberado', (data) => {
        console.log('[Client] Grupo liberado:', data);
        
        // Actualizar tablero con el estado del servidor
        if (data.tablero) {
            setTablero(data.tablero);
        }
        
        if (data.nickname === currentUserNickname) {
            setGrupoSeleccionado([]);
        }
    });

    // --- GAME UPDATE: Tablero actualizado después de un match ---
    socket.on('game_update', (data) => {
        console.log('[Client] Actualización recibida:', data);
        
        // Actualizar tablero y jugadores siempre
        setTablero(data.tablero);
        setJugadores(data.jugadores);
        setMensajeError(null);
        
        // Verificar si las celdas seleccionadas aún existen con el mismo color
        if (grupoSeleccionado.length > 0 && data.tablero) {
            const grupoSigueValido = grupoSeleccionado.every(coord => {
                const celdaAnterior = tablero[coord.fila]?.[coord.columna];
                const celdaNueva = data.tablero[coord.fila]?.[coord.columna];
                return celdaAnterior && celdaNueva && celdaAnterior.colorID === celdaNueva.colorID;
            });
            
            // Solo limpiar si el grupo ya no es válido (celdas fueron eliminadas/cambiadas)
            if (!grupoSigueValido) {
                console.log('[Client] Grupo seleccionado ya no es válido, limpiando');
                setGrupoSeleccionado([]);
            }
        }
    });

    // --- ERROR SELECCIÓN ---
    socket.on('error_seleccion', (data) => {
        console.log('[Client] Error:', data.mensaje);
        setMensajeError(data.mensaje);
        setTimeout(() => setMensajeError(null), 3000);
    });

    // --- ERROR MATCH ---
    socket.on('error_match', (data) => {
        console.log('[Client] Error match:', data.mensaje);
        setMensajeError(data.mensaje);
        setTimeout(() => setMensajeError(null), 3000);
    });

    return () => {
        socket.off('grupo_bloqueado');
        socket.off('grupo_liberado');
        socket.off('game_update');
        socket.off('error_seleccion');
        socket.off('error_match');
    };
  }, [socket, currentUserNickname, grupoSeleccionado, tablero]);

  // Cronómetro (solo para tipo Tiempo)
  useEffect(() => {
    if (gameInfo.tipoJuego === 'Tiempo' && tiempoRestante > 0) {
      const timer = setInterval(() => {
        setTiempoRestante(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [tiempoRestante, gameInfo.tipoJuego]);

  if (!tablero || tablero.length === 0) {
    return <div style={styles.windowFrame}><h1>Cargando partida...</h1></div>;
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCellClick = (fila: number, columna: number) => {
    const celda = tablero[fila][columna];
    
    // Si la celda está bloqueada por otro jugador, no hacer nada
    if (celda.bloqueadaPor && celda.bloqueadaPor !== currentUserNickname) {
      return;
    }

    console.log('[Client] Enviando selección:', fila, columna);
    socket?.emit('select_cell', { 
      partidaId, 
      fila, 
      columna, 
      nickname: currentUserNickname 
    });
  };

  const handleConfirmar = () => {
    if (grupoSeleccionado.length === 0) {
      setMensajeError('Debes seleccionar un grupo primero');
      setTimeout(() => setMensajeError(null), 3000);
      return;
    }
    
    console.log('[Client] Confirmando match');
    socket?.emit('confirm_match', { 
      partidaId, 
      nickname: currentUserNickname 
    });
    
    // Limpiar inmediatamente la selección local después de confirmar
    setGrupoSeleccionado([]);
  };

  const handleCancelar = () => {
    console.log('[Client] Cancelando selección');
    socket?.emit('cancel_selection', { 
      partidaId, 
      nickname: currentUserNickname 
    });
    setGrupoSeleccionado([]);
  };
  
  return (
    <div style={styles.windowFrame}>
        <h1 style={styles.title}>{gameInfo.tematica} - {gameInfo.tipoJuego}</h1>

        {gameInfo.tipoJuego === 'Tiempo' && (
          <div style={styles.goalHeader}>
              Tiempo restante: {formatTime(tiempoRestante)}
          </div>
        )}
        {gameInfo.tipoJuego === 'Match' && (
          <div style={styles.goalHeader}>
              Modo: Match (sin límite de tiempo)
          </div>
        )}

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
                    {tablero.map((fila, filaIdx) => 
                        fila.map((celda, colIdx) => {
                            const estaBloqueadaPorMi = celda.bloqueadaPor === currentUserNickname;
                            const estaBloqueadaPorOtro = celda.bloqueadaPor && celda.bloqueadaPor !== currentUserNickname;
                            
                            // Debug: mostrar celdas bloqueadas
                            if (celda.bloqueadaPor && filaIdx === 0 && colIdx === 0) {
                                console.log('[Render] Celda [0,0] bloqueada por:', celda.bloqueadaPor, 'Usuario actual:', currentUserNickname);
                            }
                            
                            // Mapear color del servidor a CSS
                            const colorCSS = COLOR_MAP[celda.colorID] || celda.colorID;
                            
                            return (
                                <div 
                                    key={`${filaIdx}-${colIdx}`}
                                    style={{
                                        ...styles.cell,
                                        backgroundColor: colorCSS,
                                        // Usar outline en lugar de border para no afectar el tamaño
                                        outline: estaBloqueadaPorMi
                                            ? '3px solid #00FF00' 
                                            : estaBloqueadaPorOtro
                                                ? '3px solid #FF4500' 
                                                : 'none',
                                        outlineOffset: '-3px',
                                        opacity: estaBloqueadaPorOtro ? 0.4 : 1,
                                        cursor: estaBloqueadaPorOtro ? 'not-allowed' : 'pointer',
                                        boxShadow: estaBloqueadaPorMi 
                                            ? '0 0 15px #00FF00, inset 0 0 10px rgba(0, 255, 0, 0.3)' 
                                            : estaBloqueadaPorOtro
                                                ? 'inset 0 0 20px rgba(0, 0, 0, 0.7)'
                                                : 'none',
                                        filter: estaBloqueadaPorOtro ? 'brightness(0.5) saturate(0.7)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => handleCellClick(filaIdx, colIdx)}
                                    title={celda.bloqueadaPor ? `Bloqueada por ${celda.bloqueadaPor}` : ''}
                                >
                                    {estaBloqueadaPorOtro && <span style={styles.lockIcon}>🔒</span>}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
        
        {mensajeError && (
            <div style={styles.errorMessage}>{mensajeError}</div>
        )}
        
        <div style={styles.buttonContainer}>
            <button 
                onClick={handleConfirmar} 
                style={{
                    ...styles.confirmButton,
                    opacity: grupoSeleccionado.length > 0 ? 1 : 0.4,
                    cursor: grupoSeleccionado.length > 0 ? 'pointer' : 'not-allowed',
                    transform: grupoSeleccionado.length > 0 ? 'none' : 'translateY(0)',
                    boxShadow: grupoSeleccionado.length > 0 ? '0 4px #00AA00' : '0 2px #006600',
                    filter: grupoSeleccionado.length > 0 ? 'none' : 'grayscale(30%)'
                }}
                disabled={grupoSeleccionado.length === 0}
            >
                Confirmar {grupoSeleccionado.length > 0 ? `(${grupoSeleccionado.length} celdas)` : '(0 celdas)'}
            </button>
            <button 
                onClick={handleCancelar} 
                style={{
                    ...styles.cancelButton,
                    opacity: grupoSeleccionado.length > 0 ? 1 : 0.5,
                    cursor: grupoSeleccionado.length > 0 ? 'pointer' : 'not-allowed'
                }}
                disabled={grupoSeleccionado.length === 0}
            >
                Cancelar
            </button>
        </div>
        
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
      width: '35px', 
      height: '35px', 
      borderRadius: '4px', 
      cursor: 'pointer', 
      transition: 'all 0.2s ease',
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      position: 'relative',
      boxSizing: 'border-box'
  },
  lockIcon: { 
      fontSize: '20px', 
      position: 'absolute',
      textShadow: '0 0 3px rgba(0, 0, 0, 0.8)',
      pointerEvents: 'none'
  },
  errorMessage: { color: '#FF4500', backgroundColor: '#333', padding: '10px', borderRadius: '5px', marginTop: '10px', fontWeight: 'bold' },
  buttonContainer: { display: 'flex', gap: '10px', marginTop: '10px' },
  confirmButton: { padding: '12px 30px', backgroundColor: '#00FF00', color: '#222', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 4px #00AA00' },
  cancelButton: { padding: '12px 30px', backgroundColor: '#FF4500', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 4px #CC3300' },
  leaveButton: { position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'transparent', color: '#999', border: 'none', fontSize: '12px', cursor: 'pointer' }
};