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
  const [viewState, setViewState] = useState<'playing' | 'winner'>('playing');
  const [winnerInfo, setWinnerInfo] = useState<any>(null);
  const [gameEndInfo, setGameEndInfo] = useState<{ tematica: string; partidaId: string } | null>(null);
  
  // Estados para el sistema de inicio
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  
  // Configurar según tipo de juego
  const [tiempoRestante, setTiempoRestante] = useState<number>(
    gameInfo.tipoJuego === 'Tiempo' && gameInfo.duracionMinutos 
      ? gameInfo.duracionMinutos * 60 
      : 0
  );

  // Detectar si el usuario es líder
  useEffect(() => {
    if (initialPlayers && initialPlayers.length > 0) {
      setIsLeader(initialPlayers[0].nickname === currentUserNickname);
    }
  }, [initialPlayers, currentUserNickname]);

  // Escuchar tecla U para iniciar cuenta regresiva (solo líder)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'u' && isLeader && !gameStarted && countdown === null) {
        console.log('[Juego] Líder presionó U, iniciando cuenta regresiva');
        socket?.emit('leader_start_countdown', { partidaId });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [socket, partidaId, isLeader, gameStarted, countdown]);

  useEffect(() => {
    if (!socket) return;

    // Escuchar inicio de cuenta regresiva
    socket.on('countdown_started', (data: { count: number }) => {
      console.log('[Juego] Cuenta regresiva iniciada:', data.count);
      setCountdown(data.count);
    });

    // Escuchar actualización de cuenta regresiva
    socket.on('countdown_update', (data: { count: number }) => {
      console.log('[Juego] Cuenta regresiva:', data.count);
      setCountdown(data.count);
    });

    // Escuchar fin de cuenta regresiva e inicio real del juego
    socket.on('game_actually_started', () => {
      console.log('[Juego] ¡El juego ha comenzado!');
      setCountdown(null);
      setGameStarted(true);
    });

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

    // --- JUEGO FINALIZADO ---
    socket.on('game_finished', (data) => {
        console.log('[Client] Juego finalizado:', data);
        // Navegar a la pantalla del ganador
        setViewState('winner');
        setWinnerInfo(data.ganador);
        setGameEndInfo({
            tematica: data.tematica,
            partidaId: data.partidaId
        });
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
        socket.off('countdown_started');
        socket.off('countdown_update');
        socket.off('game_actually_started');
        socket.off('grupo_bloqueado');
        socket.off('grupo_liberado');
        socket.off('game_update');
        socket.off('game_finished');
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
    } else if (gameInfo.tipoJuego === 'Tiempo' && tiempoRestante === 0) {
      // Notificar al servidor que el tiempo se agotó
      socket?.emit('tiempo_agotado', { partidaId });
    }
  }, [tiempoRestante, gameInfo.tipoJuego, socket, partidaId]);

  if (!tablero || tablero.length === 0) {
    return <div style={styles.windowFrame}><h1>Cargando partida...</h1></div>;
  }

  // Pantalla del ganador
  if (viewState === 'winner' && winnerInfo && gameEndInfo) {
    const esEmpate = winnerInfo.esEmpate || false;
    
    return (
      <div style={styles.windowFrame}>
        <div style={styles.winnerContainer}>
          <h1 style={styles.winnerTitle}>
            {esEmpate ? '🤝 ¡EMPATE! 🤝' : '🏆 ¡JUEGO FINALIZADO! 🏆'}
          </h1>
          
          <div style={styles.gameInfoSection}>
            <p style={styles.gameInfoItem}><strong>Partida:</strong> {gameEndInfo.partidaId}</p>
            <p style={styles.gameInfoItem}><strong>Temática:</strong> {gameEndInfo.tematica}</p>
          </div>

          {esEmpate ? (
            <>
              <h2 style={styles.winnerName}>Ganadores (Empate):</h2>
              <div style={styles.tieWinners}>
                {winnerInfo.ganadores.map((ganador: any) => (
                  <div key={ganador.nickname} style={styles.tieWinnerItem}>
                    <span style={styles.tieWinnerIcon}>👑</span>
                    <span style={styles.tieWinnerName}>{ganador.nickname}</span>
                  </div>
                ))}
              </div>
              <p style={styles.winnerScore}>Puntuación: {winnerInfo.puntaje} puntos</p>
            </>
          ) : (
            <>
              <h2 style={styles.winnerName}>Ganador: {winnerInfo.nickname}</h2>
              <p style={styles.winnerScore}>Puntuación: {winnerInfo.puntaje} puntos</p>
            </>
          )}
          
          <div style={styles.rankingContainer}>
            <h3 style={styles.rankingTitle}>Clasificación Final:</h3>
            {winnerInfo.ranking.map((jugador: any) => (
              <div key={jugador.nickname} style={styles.rankingItem}>
                <span style={styles.rankingPosition}>{jugador.posicion}°</span>
                <span style={styles.rankingNickname}>{jugador.nickname}</span>
                <span style={styles.rankingScore}>{jugador.puntaje} pts</span>
              </div>
            ))}
          </div>

          <button onClick={onLeave} style={styles.returnButton}>
            Volver al menú
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCellClick = (fila: number, columna: number) => {
    const celda = tablero[fila][columna];
    
    // No permitir clics hasta que el juego inicie
    if (!gameStarted) return;
    
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
    if (!gameStarted || grupoSeleccionado.length === 0) {
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

  // Pantalla de espera y cuenta regresiva
  if (!gameStarted) {
    return (
      <div style={styles.windowFrame}>
        <div style={styles.waitingOverlay}>
          <h1 style={styles.waitingTitle}>
            {countdown !== null ? '¡PREPARADOS!' : 'Esperando inicio...'}
          </h1>
          
          {countdown !== null && countdown > 0 && (
            <div style={styles.countdownNumber}>{countdown}</div>
          )}
          
          {countdown === 0 && (
            <div style={styles.countdownNumber}>¡GO!</div>
          )}
          
          {countdown === null && isLeader && (
            <div style={styles.leaderInstructions}>
              <p style={styles.instructionText}>
                👑 Eres el líder de la partida
              </p>
              <p style={styles.instructionText}>
                Presiona la tecla <span style={styles.keyHighlight}>U</span> para iniciar la cuenta regresiva
              </p>
            </div>
          )}
          
          {countdown === null && !isLeader && (
            <div style={styles.waitingMessage}>
              <p style={styles.instructionText}>
                Esperando a que el líder inicie la partida...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
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
  leaveButton: { position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'transparent', color: '#999', border: 'none', fontSize: '12px', cursor: 'pointer' },
  gameInfoSection: { backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #444' },
  gameInfoItem: { fontSize: '16px', color: '#DDD', margin: '8px 0', textAlign: 'left' },
  winnerContainer: { textAlign: 'center', padding: '40px', backgroundColor: '#1a1a1a', borderRadius: '15px', maxWidth: '600px', margin: '0 auto' },
  winnerTitle: { fontSize: '36px', color: '#FFD700', marginBottom: '20px', textShadow: '2px 2px 4px rgba(255, 215, 0, 0.5)' },
  winnerName: { fontSize: '28px', color: '#FFF', marginBottom: '10px' },
  winnerScore: { fontSize: '22px', color: '#00FF00', marginBottom: '30px' },
  rankingContainer: { backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '10px', marginBottom: '30px' },
  rankingTitle: { fontSize: '20px', color: '#FFD700', marginBottom: '15px' },
  rankingItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#333', borderRadius: '5px', marginBottom: '8px' },
  rankingPosition: { fontSize: '18px', fontWeight: 'bold', color: '#FFD700', minWidth: '40px' },
  rankingNickname: { fontSize: '18px', color: '#FFF', flex: 1, textAlign: 'left', marginLeft: '15px' },
  rankingScore: { fontSize: '18px', color: '#00FF00', fontWeight: 'bold' },
  returnButton: { padding: '15px 40px', backgroundColor: '#4A90E2', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', transition: 'all 0.2s' },
  
  // Estilos para pantalla de espera y cuenta regresiva
  waitingOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    minWidth: '500px',
    padding: '50px'
  },
  waitingTitle: {
    fontSize: '48px',
    color: '#61dafb',
    marginBottom: '40px',
    textShadow: '0 0 20px rgba(97, 218, 251, 0.5)'
  },
  countdownNumber: {
    fontSize: '120px',
    fontWeight: 'bold',
    color: '#FFD700',
    textShadow: '0 0 40px rgba(255, 215, 0, 0.8)',
    animation: 'pulse 0.5s ease-in-out'
  },
  leaderInstructions: {
    textAlign: 'center',
    padding: '30px',
    backgroundColor: '#444857',
    borderRadius: '15px',
    border: '3px solid #FFD700'
  },
  waitingMessage: {
    textAlign: 'center',
    padding: '30px',
    backgroundColor: '#444857',
    borderRadius: '15px'
  },
  instructionText: {
    fontSize: '20px',
    color: '#FFF',
    margin: '10px 0'
  },
  keyHighlight: {
    display: 'inline-block',
    padding: '5px 15px',
    backgroundColor: '#FFD700',
    color: '#000',
    borderRadius: '5px',
    fontWeight: 'bold',
    fontSize: '24px',
    margin: '0 5px',
    boxShadow: '0 4px #CC9900'
  },
  
  // Estilos para empate
  tieWinners: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#2a2a2a',
    borderRadius: '10px',
    border: '2px solid #FFD700'
  },
  tieWinnerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px 20px',
    backgroundColor: '#333',
    borderRadius: '8px',
    border: '2px solid #FFD700'
  },
  tieWinnerIcon: {
    fontSize: '28px'
  },
  tieWinnerName: {
    fontSize: '22px',
    color: '#FFD700',
    fontWeight: 'bold',
    flex: 1
  }
};