// client/src/views/LobbyPartidas.tsx

import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext'; // Si se necesita el nickname del usuario
// import { socket } from '../api/socket'; // Si se define la instancia de Socket.IO globalmente

// --- Interfaces de Tipos ---
interface PartidaDisponible {
  id: string; // Corresponde a "Identificador"
  tematica: string; // No está en la API actual, se podría añadir o mockear
  tipo: 'Match' | 'Tiempo'; // Corresponde a "Tipo"
  jugadores: number; // Corresponde a "Jugadores" (número actual)
  maxJugadores: number; // Necesario para "X/Y" en Jugadores
  tiempoRestante: string; // Mockeado para "Tiempo restante"
}

interface LobbyPartidasProps {
  onBack: () => void; // Función para regresar al menú principal
  onJoinSuccess: (partidaId: string) => void; // Función al unirse exitosamente
}

export const LobbyPartidas: React.FC<LobbyPartidasProps> = ({ onBack, onJoinSuccess }) => {
    const [partidasDisponibles, setPartidasDisponibles] = useState<PartidaDisponible[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPartidaId, setSelectedPartidaId] = useState<string | null>(null);

  // const { currentUser } = useAuth(); // Obtener el usuario logueado

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
      // REQ-011: Llama a la ruta REST para obtener partidas disponibles
      const response = await fetch('http://localhost:4000/api/partidas'); 
      const data: { id: string, tipo: 'Vs' | 'Vs Tiempo', jugadores: number }[] = await response.json();
      
      if (response.ok) {
        // Mapear los datos de la API a la interfaz PartidaDisponible,
        // añadiendo temáticas y tiempo restante mockeados por ahora.
        const mappedData: PartidaDisponible[] = data.map(p => ({
          id: p.id,
          tipo: p.tipo === 'Vs' ? 'Match' : 'Tiempo',
          jugadores: p.jugadores,
          tematica: p.id.startsWith('A') ? 'Hawai' : p.id.startsWith('B') ? 'Jungla' : 'Saturno', // Mock
          maxJugadores: 2, // Asumimos 2 por ahora, REQ-008
          tiempoRestante: '2:59', // Mock
        }));
        setPartidasDisponibles(mappedData);
      } else {
        setError('Error al cargar partidas del servidor.');
      }
    } catch (e) {
      setError('Fallo de conexión con el servidor backend.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnirseClick = async () => {
    if (!selectedPartidaId) {
      alert('Por favor, selecciona una partida para unirte.');
      return;
    }

    // --- Lógica de unirse a la partida (REQ-012) ---
    console.log(`Intentando unirse a la partida: ${selectedPartidaId}`);
    
    try {
      // Se enviaría un evento de Socket.IO al backend:
      /*
      if (currentUser && socket) {
        socket.emit('unirse_partida', { 
            codigo: selectedPartidaId, 
            nickname: currentUser.nickname 
        });

        // Escuchar un evento de confirmación o error desde el backend
        socket.once('partida_unida_exitosa', (data) => {
            onJoinSuccess(data.partidaId);
        });
        socket.once('error_partida', (data) => {
            alert(`Error al unirse: ${data.message}`);
        });
      }
      */

      // SIMULACIÓN EXITOSA (para fines de prueba sin Socket.IO completo):
      setTimeout(() => {
        alert(`Te has unido a la partida ${selectedPartidaId}`);
        onJoinSuccess(selectedPartidaId);
      }, 500);

    } catch (e) {
      setError('No se pudo establecer la conexión para unirse.');
      console.error(e);
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
                  <th style={styles.tableHeader}>Identificador</th>
                  <th style={styles.tableHeader}>Temática</th>
                  <th style={styles.tableHeader}>Tipo</th>
                  <th style={styles.tableHeader}>Jugadores</th>
                  <th style={styles.tableHeader}>Tiempo restante</th>
                </tr>
              </thead>
              <tbody>
                {partidasDisponibles.map((partida) => (
                  <tr 
                    key={partida.id} 
                    style={selectedPartidaId === partida.id ? styles.tableRowSelected : styles.tableRow}
                    onClick={() => setSelectedPartidaId(partida.id)}
                  >
                    <td style={styles.tableCell}>{partida.id}</td>
                    <td style={styles.tableCell}>{partida.tematica}</td>
                    <td style={styles.tableCell}>{partida.tipo}</td>
                    <td style={styles.tableCell}>{partida.jugadores}/{partida.maxJugadores}</td>
                    <td style={styles.tableCell}>{partida.tiempoRestante}</td>
                  </tr>
                ))}
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