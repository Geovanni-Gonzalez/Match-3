// client/src/views/Juego.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Juego.css';

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
    return (
      <div className="juego-container">
        <div className="juego-background">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="juego-particle"></div>
          ))}
        </div>
        <div className="juego-card">
          <h1>Cargando partida...</h1>
        </div>
      </div>
    );
  }

  // Pantalla del ganador
  if (viewState === 'winner' && winnerInfo && gameEndInfo) {
    const esEmpate = winnerInfo.esEmpate || false;
    
    return (
      <div className="juego-container">
        <div className="juego-background">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="juego-particle"></div>
          ))}
        </div>
        <div className="juego-card">
          <div className="winner-container">
            <h1 className="winner-title">
              {esEmpate ? '🤝 ¡EMPATE! 🤝' : '🏆 ¡JUEGO FINALIZADO! 🏆'}
            </h1>
            
            <div className="game-info-section">
              <p className="game-info-item"><strong>Partida:</strong> {gameEndInfo.partidaId}</p>
              <p className="game-info-item"><strong>Temática:</strong> {gameEndInfo.tematica}</p>
            </div>

            {esEmpate ? (
              <>
                <h2 className="winner-name">Ganadores (Empate):</h2>
                <div className="tie-winners">
                  {winnerInfo.ganadores.map((ganador: any) => (
                    <div key={ganador.nickname} className="tie-winner-item">
                      <span className="tie-winner-icon">👑</span>
                      <span className="tie-winner-name">{ganador.nickname}</span>
                    </div>
                  ))}
                </div>
                <p className="winner-score">Puntuación: {winnerInfo.puntaje} puntos</p>
              </>
            ) : (
              <>
                <h2 className="winner-name">Ganador: {winnerInfo.nickname}</h2>
                <p className="winner-score">Puntuación: {winnerInfo.puntaje} puntos</p>
              </>
            )}
            
            <div className="ranking-container">
              <h3 className="ranking-title">Clasificación Final:</h3>
              {winnerInfo.ranking.map((jugador: any) => (
                <div key={jugador.nickname} className="ranking-item">
                  <span className="ranking-position">{jugador.posicion}°</span>
                  <span className="ranking-nickname">{jugador.nickname}</span>
                  <span className="ranking-score">{jugador.puntaje} pts</span>
                </div>
              ))}
            </div>

            <button onClick={onLeave} className="return-button">
              Volver al menú
            </button>
          </div>
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
      <div className="juego-container">
        <div className="juego-background">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="juego-particle"></div>
          ))}
        </div>
        <div className="juego-card">
          <div className="waiting-overlay">
            <h1 className="waiting-title">
              {countdown !== null ? '¡PREPARADOS!' : 'Esperando inicio...'}
            </h1>
            
            {countdown !== null && countdown > 0 && (
              <div className="countdown-number">{countdown}</div>
            )}
            
            {countdown === 0 && (
              <div className="countdown-number">¡GO!</div>
            )}
            
            {countdown === null && isLeader && (
              <div className="leader-instructions">
                <p className="instruction-text">
                  👑 Eres el líder de la partida
                </p>
                <p className="instruction-text">
                  Presiona la tecla <span className="key-highlight">U</span> para iniciar la cuenta regresiva
                </p>
              </div>
            )}
            
            {countdown === null && !isLeader && (
              <div className="waiting-message">
                <p className="instruction-text">
                  Esperando a que el líder inicie la partida...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="juego-container">
      <div className="juego-background">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="juego-particle"></div>
        ))}
      </div>
      <div className="juego-card">
        <h1 className="juego-title">{gameInfo.tematica} - {gameInfo.tipoJuego}</h1>

        {gameInfo.tipoJuego === 'Tiempo' && (
          <div className="goal-header">
              Tiempo restante: {formatTime(tiempoRestante)}
          </div>
        )}
        {gameInfo.tipoJuego === 'Match' && (
          <div className="goal-header">
              Modo: Match (sin límite de tiempo)
          </div>
        )}

        <div className="game-area">
            <div className="score-panel">
                <table className="score-table">
                    <thead>
                        <tr>
                            <th className="score-header">Nombre</th>
                            <th className="score-header">Puntaje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jugadores
                           .sort((a, b) => b.puntaje - a.puntaje)
                           .map((jugador) => (
                            <tr 
                                key={jugador.nickname} 
                                className={jugador.nickname === currentUserNickname ? 'current-user-row' : ''}
                            >
                                <td className="score-cell">{jugador.nickname}</td>
                                <td className="score-cell">{jugador.puntaje}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="board-container">
                <div className="board-grid">
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
                                    className={`cell ${estaBloqueadaPorMi ? 'locked-by-me' : ''} ${estaBloqueadaPorOtro ? 'locked-by-other' : ''}`}
                                    style={{ backgroundColor: colorCSS }}
                                    onClick={() => handleCellClick(filaIdx, colIdx)}
                                    title={celda.bloqueadaPor ? `Bloqueada por ${celda.bloqueadaPor}` : ''}
                                >
                                    {estaBloqueadaPorOtro && <span className="lock-icon">🔒</span>}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
        
        {mensajeError && (
            <div className="error-message">{mensajeError}</div>
        )}
        
        <div className="button-container">
            <button 
                onClick={handleConfirmar} 
                className="confirm-button"
                style={{
                    opacity: grupoSeleccionado.length > 0 ? 1 : 0.4,
                    cursor: grupoSeleccionado.length > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: grupoSeleccionado.length > 0 ? '0 4px #00AA00' : '0 2px #006600',
                    filter: grupoSeleccionado.length > 0 ? 'none' : 'grayscale(30%)'
                }}
                disabled={grupoSeleccionado.length === 0}
            >
                Confirmar {grupoSeleccionado.length > 0 ? `(${grupoSeleccionado.length} celdas)` : '(0 celdas)'}
            </button>
            <button 
                onClick={handleCancelar} 
                className="cancel-button"
                style={{
                    opacity: grupoSeleccionado.length > 0 ? 1 : 0.5,
                    cursor: grupoSeleccionado.length > 0 ? 'pointer' : 'not-allowed'
                }}
                disabled={grupoSeleccionado.length === 0}
            >
                Cancelar
            </button>
        </div>
        
        <button onClick={onLeave} className="leave-button">Abandonar Partida</button>
      </div>
    </div>
  );
};