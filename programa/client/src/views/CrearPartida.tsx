// client/src/views/CrearPartida.tsx
import { useAuth } from '../context/AuthContext';
import React, { useState } from 'react';
import axios from 'axios';
import { useGameEvents } from '../hooks/useGameEvents';

const API_URL = 'http://localhost:4000/api';

// -------------------------------
// PROPS
// -------------------------------
interface CrearPartidaProps {
  onBack: () => void;
  onCreateSuccess: (partidaId: string) => void;
}

export const CrearPartida: React.FC<CrearPartidaProps> = ({
  onBack,
  onCreateSuccess
}) => {

  // Hook en modo general SIN partidaId
  const {
    joinGame,

  } = useGameEvents(null as any);

  const { currentUser } = useAuth();

  // -------------------------------
  // Estados
  // -------------------------------
  const [tipoJuego, setTipoJuego] = useState<'Match' | 'Tiempo'>('Match');
  const [tematica, setTematica] = useState<string>('Gemas');
  const [numJugadores, setNumJugadores] = useState<number>(2);
  const [duracionMinutos, setDuracionMinutos] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opcionesTematica = ['Gemas', 'Monstruos', 'Frutas', 'Animales'];
  const opcionesTipoJuego = [
    { value: 'Match', label: 'Match' },
    { value: 'Tiempo', label: 'Tiempo' }
  ];

  // -------------------------------
  // CREAR PARTIDA
  // -------------------------------
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
      const response = await axios.post(`${API_URL}/partida/crear_partida`, {
        tipoJuego,
        tematica,
        numJugadoresMax: numJugadores
      });

      if (response.status !== 201 || !response.data.codigoPartida) {
        setError("Error al crear partida en backend.");
        setLoading(false);
        return;
      }

      const codigoPartida = response.data.codigoPartida;
      console.log("[CrearPartida] partidaId recibido →", codigoPartida);

      joinGame?.(
        codigoPartida,
        currentUser?.nickname || "Jugador",
        currentUser?.idDB ?? 0
      );
      onCreateSuccess(codigoPartida);

    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // UI
  // -------------------------------
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
    </div >
  );
};

export default CrearPartida;