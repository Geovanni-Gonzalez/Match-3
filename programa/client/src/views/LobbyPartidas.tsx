// client/src/views/LobbyPartidas.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../api/socket';

// --- Interfaces de Tipos ---
interface PartidaDisponible {
  id: string; // UUID interno para operaciones
  codigo: string; // Código visual de 6 caracteres
  tipo: 'Match' | 'Tiempo';
  tematica: string;
  jugadores: number; // Número actual de jugadores
  maxJugadores: number;
  tiempoRestante: number; // En segundos
  duracionMinutos?: number; // Duración configurada (solo para tipo Tiempo)
  estado: string;
  nicknames: string[]; // Lista de nicknames de jugadores unidos
}

interface LobbyPartidasProps {
  onBack: () => void; // Función para regresar al menú principal
  onJoinSuccess: (partidaId: string) => void; // Función al unirse exitosamente
}

export const LobbyPartidas: React.FC<LobbyPartidasProps> = ({ onBack, onJoinSuccess }) => {
    const { currentUser } = useAuth(); // Obtener el usuario logueado
    const [partidasDisponibles, setPartidasDisponibles] = useState<PartidaDisponible[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPartidaId, setSelectedPartidaId] = useState<string | null>(null);
    const [selectedPartida, setSelectedPartida] = useState<any>(null);

    useEffect(() => {
        fetchPartidas();
        // En un entorno real, aquí se podría establecer un polling o un listener de Socket.IO
        // para recibir actualizaciones de partidas disponibles en tiempo real.
        const intervalId = setInterval(fetchPartidas, 5000); // Recargar cada 5 segundos
        return () => clearInterval(intervalId); // Limpiar al desmontar
    }, []);

  const fetchPartidas = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[LOBBY] Obteniendo partidas disponibles...');
      
      // REQ-011: Llama a la ruta REST para obtener partidas disponibles
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/partidas`); 
      const data = await response.json();
      
      console.log('[LOBBY] Respuesta del servidor:', data);
      
      if (response.ok && data.success) {
        // La API devuelve { success, total, partidas }
        const partidas: PartidaDisponible[] = data.partidas.map((p: any) => ({
          id: p.id, // UUID interno para operaciones
          codigo: p.codigo, // Código visual
          tipo: p.tipo,
          tematica: p.tematica,
          jugadores: p.jugadores,
          maxJugadores: p.maxJugadores,
          tiempoRestante: p.tiempoRestante,
          estado: p.estado,
          nicknames: p.nicknames || []
        }));
        
        setPartidasDisponibles(partidas);
        console.log(`[LOBBY] ${partidas.length} partidas cargadas`);
      } else {
        setError(data.message || 'Error al cargar partidas del servidor.');
      }
    } catch (e) {
      setError('Fallo de conexión con el servidor backend.');
      console.error('[LOBBY] Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnirseClick = async () => {
    if (!selectedPartidaId || !selectedPartida) {
      alert('Por favor, selecciona una partida para unirte.');
      return;
    }

    if (!currentUser) {
      alert('Debes estar autenticado para unirte a una partida.');
      return;
    }

    console.log(`[LOBBY] Intentando unirse a la partida: ${selectedPartidaId} (ID: ${selectedPartida.id})`);
    
    try {
      // Primero llamar a la API REST para unirse (usando el ID interno)
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/partidas/${selectedPartida.id}/unirse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: currentUser.nickname,
          socketID: currentUser.socketID
        }),
      });

      const data = await response.json();
      console.log('[LOBBY] Respuesta de unirse:', data);

      if (response.ok && data.success) {
        // Luego conectarse por Socket.IO
        const socket = getSocket();
        if (socket) {
          socket.emit('unirse_partida', { 
            codigo: selectedPartida.id, // Usar ID interno para sockets
            nickname: currentUser.nickname 
          });

          // Escuchar eventos de la partida
          socket.on('partida_actualizada', (partidaData) => {
            console.log('[SOCKET] Partida actualizada:', partidaData);
          });

          socket.on('error_partida', (errorData) => {
            alert(`Error: ${errorData.message}`);
          });
        }

        alert(`¡Te has unido a la partida ${selectedPartidaId}!`);
        onJoinSuccess(selectedPartida.id); // Pasar ID interno
      } else {
        alert(`Error al unirse: ${data.message}`);
      }
    } catch (e) {
      setError('No se pudo establecer la conexión para unirse.');
      console.error('[LOBBY] Error:', e);
    }
  };

  return (
    <div style={styles.windowFrame}>
      {/* Botón de retroceso */}
      <div style={styles.backButton} onClick={onBack}>
        &larr;
      </div>
      
      <div style={styles.header}>
        <h1 style={styles.title}>Partidas</h1>
      </div>

      <div style={styles.content}>
        <h3 style={styles.subtitle}>Partidas disponibles:</h3>
        
        {loading && <p style={styles.loadingText}>Cargando partidas...</p>}
        {error && <p style={styles.errorText}>Error: {error}</p>}

        {!loading && !error && partidasDisponibles.length === 0 && (
          <p style={styles.noPartidasText}>No hay partidas disponibles en este momento.</p>
        )}

        {!loading && !error && partidasDisponibles.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Código</th>
                  <th style={styles.tableHeader}>Temática</th>
                  <th style={styles.tableHeader}>Tipo</th>
                  <th style={styles.tableHeader}>Jugadores</th>
                  <th style={styles.tableHeader}>Duración/Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {partidasDisponibles.map((partida) => {
                  // Calcular el texto para la columna de duración/tiempo
                  let duracionTexto = 'N/A';
                  if (partida.tipo === 'Tiempo' && partida.duracionMinutos) {
                    duracionTexto = `${partida.duracionMinutos} min`;
                  } else if (partida.tipo === 'Match') {
                    duracionTexto = 'N/A';
                  }
                  
                  return (
                  <tr 
                    key={partida.codigo} 
                    style={selectedPartidaId === partida.codigo ? styles.tableRowSelected : styles.tableRow}
                    onClick={() => {
                      setSelectedPartidaId(partida.codigo);
                      setSelectedPartida(partida);
                    }}
                  >
                    <td style={styles.tableCell}>{partida.codigo}</td>
                    <td style={styles.tableCell}>{partida.tematica}</td>
                    <td style={styles.tableCell}>{partida.tipo}</td>
                    <td style={styles.tableCell}>{partida.jugadores}/{partida.maxJugadores}</td>
                    <td style={styles.tableCell}>{duracionTexto}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <button 
          onClick={handleUnirseClick} 
          disabled={!selectedPartidaId || loading} 
          style={styles.unirseButton}
        >
          Unirse
        </button>
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
    width: '600px', // Ancho ajustado para la tabla
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
  subtitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    alignSelf: 'flex-start', // Alinea a la izquierda como en el wireframe
  },
  loadingText: {
    color: '#61dafb',
    margin: '20px 0',
  },
  errorText: {
    color: '#ff6b6b',
    margin: '20px 0',
  },
  noPartidasText: {
    color: '#ccc',
    margin: '20px 0',
  },
  tableWrapper: {
    width: '100%',
    maxHeight: '300px', // Para el scroll si hay muchas partidas
    overflowY: 'auto',
    border: '1px solid #555',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#4CAF50', // Color verde
    color: 'white',
    padding: '10px',
    textAlign: 'left',
    position: 'sticky', // Para que el header se quede arriba al hacer scroll
    top: 0,
    zIndex: 1,
  },
  tableRow: {
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  tableRowSelected: {
    cursor: 'pointer',
    backgroundColor: '#55596e', // Color ligeramente diferente al seleccionar
    transition: 'background-color 0.2s',
  },
  tableCell: {
    padding: '10px',
    borderBottom: '1px solid #444',
    textAlign: 'left',
  },
  unirseButton: {
    padding: '12px 30px',
    backgroundColor: '#4CAF50', // Verde como en el wireframe
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
};