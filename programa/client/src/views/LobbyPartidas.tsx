// client/src/views/LobbyPartidas.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../api/socket';
import './LobbyPartidas.css';

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
    <div className="lobby-partidas-container">
      {/* Fondo animado con gradiente */}
      <div className="lobby-partidas-background"></div>
      
      {/* Partículas flotantes */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="lobby-partidas-particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${8 + Math.random() * 12}s`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}

      {/* Gemas decorativas */}
      <div className="gem gem-red" style={{ top: '8%', left: '10%', animationDelay: '0s' }}>💎</div>
      <div className="gem gem-blue" style={{ top: '15%', right: '12%', animationDelay: '1s' }}>💎</div>
      <div className="gem gem-green" style={{ bottom: '18%', left: '8%', animationDelay: '2s' }}>💎</div>
      <div className="gem gem-yellow" style={{ top: '45%', left: '5%', animationDelay: '1.5s' }}>💎</div>
      <div className="gem gem-purple" style={{ bottom: '25%', right: '10%', animationDelay: '2.5s' }}>💎</div>
      <div className="gem gem-orange" style={{ top: '60%', right: '7%', animationDelay: '0.8s' }}>💎</div>

      {/* Burbujas flotantes */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bubble"
          style={{
            left: `${10 + i * 12}%`,
            animationDuration: `${15 + Math.random() * 10}s`,
            animationDelay: `${i * 2}s`,
          }}
        />
      ))}

      {/* Botón de retroceso */}
      <button className="back-button" onClick={onBack}>
        ← Volver
      </button>
      
      {/* Card principal */}
      <div className="lobby-partidas-card">
        <h1 className="lobby-partidas-title">Partidas Disponibles</h1>
        
        <h3 className="lobby-subtitle">📋 Lista de partidas:</h3>
        
        {loading && <p className="loading-text">⏳ Cargando partidas...</p>}
        {error && <p className="error-text">❌ Error: {error}</p>}

        {!loading && !error && partidasDisponibles.length === 0 && (
          <p className="no-partidas-text">No hay partidas disponibles en este momento.</p>
        )}

        {!loading && !error && partidasDisponibles.length > 0 && (
          <div className="table-wrapper">
            <table className="partidas-table">
              <thead>
                <tr>
                  <th className="table-header">Código</th>
                  <th className="table-header">Temática</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Jugadores</th>
                  <th className="table-header">Duración/Tiempo</th>
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
                    className={`table-row ${selectedPartidaId === partida.codigo ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedPartidaId(partida.codigo);
                      setSelectedPartida(partida);
                    }}
                  >
                    <td className="table-cell">{partida.codigo}</td>
                    <td className="table-cell">{partida.tematica}</td>
                    <td className="table-cell">{partida.tipo}</td>
                    <td className="table-cell">{partida.jugadores}/{partida.maxJugadores}</td>
                    <td className="table-cell">{duracionTexto}</td>
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
          className="unirse-button"
        >
          🚀 Unirse a Partida
        </button>
      </div>
    </div>
  );
};

export default LobbyPartidas;