/**
 * @file CrearPartida.tsx
 * @description Vista para la configuración y creación de nuevas partidas.
 * 
 * Permite al usuario seleccionar:
 * - Tipo de juego (Match o Tiempo).
 * - Temática visual.
 * - Número máximo de jugadores.
 * - Duración (si aplica).
 * 
 * Se comunica con el backend para instanciar la partida y redirige al lobby.
 */

import { useAuth } from '../context/AuthContext';
import React, { useState } from 'react';
import axios from 'axios';
import { useGameEvents } from '../hooks/useGameEvents';
import '../styles/CrearPartida.css';
import { Logger } from '../utils/Logger';
import { Background } from '../components/Background';

import { API_URL } from '../config';

// -------------------------------
// PROPS
// -------------------------------
interface CrearPartidaProps {
  /** Función para volver al menú anterior. */
  onBack: () => void;
  /** Callback ejecutado al crear exitosamente la partida. Recibe el ID de la partida. */
  onCreateSuccess: (partidaId: string) => void;
}

/**
 * Componente de formulario para crear una nueva partida.
 */
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
  /**
   * Envía la solicitud de creación de partida al servidor.
   * Valida la sesión del usuario y maneja la respuesta.
   */
  const handleCrearPartida = async () => {
    Logger.info('[CREAR PARTIDA] Iniciando...');
    Logger.info('[CREAR PARTIDA] Usuario actual:', currentUser);

    if (!currentUser) {
      Logger.error('[CREAR PARTIDA] Error: currentUser es null');
      setError('Debes estar autenticado para crear una partida. Por favor, regresa e ingresa tu nickname.');
      return;
    }

    if (!currentUser.nickname) {
      Logger.error('[CREAR PARTIDA] Error: nickname no existe en currentUser');
      setError('Error: No se encontró tu nickname. Por favor, regresa e ingresa nuevamente.');
      return;
    }

    setError(null);
    setLoading(true);





    try {
      const response = await axios.post(`${API_URL}/api/partida/crear_partida`, {
        tipoJuego,
        tematica,
        numJugadoresMax: numJugadores,
        duracion: tipoJuego === 'Tiempo' ? duracionMinutos : undefined
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
      <Background />

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
                onChange={(e) => setDuracionMinutos(Math.max(1, Math.min(180, parseInt(e.target.value) || 5)))}
                min="1"
                max="180"
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