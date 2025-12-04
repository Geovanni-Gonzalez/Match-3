// client/src/views/CrearPartida.tsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './CrearPartida.css';

// --- Interfaces de Tipos ---
interface CrearPartidaProps {
  onBack: () => void; // Función para regresar al menú principal
  onCreateSuccess: (partidaId: string) => void; // Función al crear exitosamente
}

export const CrearPartida: React.FC<CrearPartidaProps> = ({ onBack, onCreateSuccess }) => {
  const { currentUser } = useAuth(); // Obtener usuario autenticado
  const [tipoJuego, setTipoJuego] = useState<'Match' | 'Tiempo'>('Match'); // Default "Match"
  const [tematica, setTematica] = useState<string>('Gemas'); // Default "Match" (interpretado como Temática)
  const [numJugadores, setNumJugadores] = useState<number>(2); // Default 2, REQ-008
  const [duracionMinutos, setDuracionMinutos] = useState<number>(5); // Default 5 minutos para tipo Tiempo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Opciones para los selectores (REQ-003 COLORES_VALIDOS para temática)
  const opcionesTematica = ['Gemas', 'Monstruos', 'Frutas', 'Animales']; // Mock de temáticas
  const opcionesTipoJuego = [
    { value: 'Match', label: 'Match' }, 
    { value: 'Tiempo', label: 'Tiempo' }
  ];

  const handleCrearPartida = async () => {
    console.log('[CREAR PARTIDA] Iniciando...');
    console.log('[CREAR PARTIDA] Usuario actual:', currentUser);
    
    if (!currentUser) {
      console.error('[CREAR PARTIDA] Error: currentUser es null');
      setError('Debes estar autenticado para crear una partida. Por favor, regresa e ingresa tu nickname.');
      return;
    }

    if (!currentUser.nickname) {
      console.error('[CREAR PARTIDA] Error: nickname no existe en currentUser');
      setError('Error: No se encontró tu nickname. Por favor, regresa e ingresa nuevamente.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      console.log('[CREAR PARTIDA] Enviando solicitud al backend...');
      
      // REQ-007: Llama a la ruta REST para crear una partida (POST /api/partidas)
      const body: any = {
        nickname: currentUser.nickname,
        socketID: currentUser.socketID,
        tipoJuego: tipoJuego,
        tematica: tematica,
        numJugadoresMax: numJugadores, // REQ-008
      };

      // Si es tipo Tiempo, agregar duración
      if (tipoJuego === 'Tiempo') {
        body.duracionMinutos = duracionMinutos;
      }

      console.log('[CREAR PARTIDA] Body a enviar:', body);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/partidas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('[CREAR PARTIDA] Response status:', response.status);
      const data = await response.json();
      console.log('[CREAR PARTIDA] Respuesta del servidor:', data);

      if (response.ok && data.success) {
        const partidaId = data.partidaId;
        console.log('[CREAR PARTIDA] Partida creada con ID:', partidaId);
        onCreateSuccess(partidaId); // Notifica al padre para ir a sala de espera
      } else {
        setError(data.message || 'Error al crear la partida.');
      }
    } catch (e) {
      setError('Fallo de conexión con el servidor backend.');
      console.error('[CREAR PARTIDA] Error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crear-partida-container">
      {/* Fondo animado con gradiente */}
      <div className="crear-partida-background"></div>
      
      {/* Partículas flotantes */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="crear-partida-particle"
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
      <div className="crear-partida-card">
        <div className="crear-partida-header">
          <h1 className="crear-partida-title">Crear Partida</h1>
        </div>

        <div className="crear-partida-form">
          {/* Tipo de juego */}
          <div className="form-group">
            <label className="form-label">Tipo de juego:</label>
            <select 
              value={tipoJuego} 
              onChange={(e) => setTipoJuego(e.target.value as 'Match' | 'Tiempo')}
              className="form-select"
            >
              {opcionesTipoJuego.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Temática */}
          <div className="form-group">
            <label className="form-label">Temática:</label>
            <select 
              value={tematica} 
              onChange={(e) => setTematica(e.target.value)}
              className="form-select"
            >
              {opcionesTematica.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* N° de jugadores */}
          <div className="form-group">
            <label className="form-label">N° de jugadores:</label>
            <input 
              type="number" 
              value={numJugadores} 
              onChange={(e) => setNumJugadores(Math.max(2, parseInt(e.target.value) || 2))} // Mínimo 2
              min="2" // REQ-008: Mínimo 2 jugadores
              max="8" // Máximo de 8 jugadores
              className="form-input"
            />
          </div>

          {/* Duración (solo si es tipo Tiempo) */}
          {tipoJuego === 'Tiempo' && (
            <div className="form-group">
              <label className="form-label">Duración (minutos):</label>
              <input 
                type="number" 
                value={duracionMinutos} 
                onChange={(e) => setDuracionMinutos(Math.max(1, parseInt(e.target.value) || 5))}
                min="1"
                max="30"
                className="form-input"
              />
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <p className="error-text">{error}</p>
            </div>
          )}

          {/* Botón continuar */}
          <button 
            onClick={handleCrearPartida} 
            disabled={loading} 
            className="continue-button"
          >
            {loading ? '⏳ Creando...' : '🚀 Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrearPartida;