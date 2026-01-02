/**
 * @file Bienvenida.tsx
 * @description Vista inicial de la aplicación. Permite al usuario registrarse con un nickname.
 * 
 * Esta vista maneja:
 * - Entrada del nombre de usuario.
 * - Validación básica (longitud mínima).
 * - Registro en el backend vía API REST.
 * - Inicio de sesión en el contexto global (Socket.IO).
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Bienvenida.css';
import { Logger } from '../utils/Logger';
import { Background } from '../components/Background';

/**
 * Componente de pantalla de bienvenida y login.
 */
export const Bienvenida: React.FC = () => {
  const { login, apiUrl } = useAuth();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Maneja el proceso de inicio de sesión.
   * 1. Valida el nickname.
   * 2. Registra al jugador en la base de datos.
   * 3. Establece la sesión en el contexto global.
   */
  const handleLogin = async () => {
    if (nickname.trim().length < 3) {
      setError("El nickname debe tener al menos 3 caracteres.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      Logger.info("[Cliente] Registrando jugador...");
      Logger.info("[Cliente] Usando API URL:", apiUrl);

      const res = await axios.post(`${apiUrl}/api/jugador/registrar`, { nickname }, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const jugadorId = res.data.jugadorId;

      Logger.info(`[Cliente] Jugador registrado con ID DB: ${jugadorId}`);

      // Iniciar sesión (activa el socket + guarda nickname)
      await login(nickname, jugadorId);

      Logger.info("[Cliente] Sesión establecida correctamente.");

    } catch (err) {
      Logger.error("[Cliente] Error al iniciar sesión:", err);

      const errMsg =
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Error en el servidor. ¿Está el servidor corriendo?"
          : "Error desconocido.";

      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Permite iniciar sesión presionando Enter.
   * @param e - Evento de teclado.
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="bienvenida-container">
      <Background />

      <div className="welcome-card">
        {/* Brillo superior del card */}
        <div className="card-shine"></div>

        {/* Logo/Título con efecto premium */}
        <div className="title-container">
          <div className="logo-container">
            <div className="logo-glow"></div>
            <div className="logo-icon">💎</div>
          </div>
          <h1 className="game-title animated-title">Match-3</h1>
          <p className="title-shadow">LEGENDARY PUZZLE</p>
          <div className="title-underline"></div>
        </div>

        <p className="subtitle">✨¡Compite contra tus amigos!✨</p>

        {/* Input con diseño premium */}
        <div className="input-container input-wrapper">
          <div className="input-icon">👤</div>
          <input
            type="text"
            placeholder="Tu nombre de jugador legendario"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyPress={handleKeyPress}
            className="premium-input"
            maxLength={20}
          />
          <div className="input-border-animation"></div>
        </div>

        {/* Mensaje de error mejorado */}
        {error && (
          <div className="error-container">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Botón premium con efectos avanzados */}
        <button
          onClick={handleLogin}
          disabled={nickname.trim().length < 3 || isLoading}
          className="premium-button"
          onMouseEnter={(e) => {
            if (nickname.trim().length >= 3 && !isLoading) {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          <div className="button-glow"></div>
          {isLoading ? (
            <>
              <span className="spinner"></span>
              <span className="button-loading-text">Conectando al servidor...</span>
            </>
          ) : (
            <>
              <span className="button-text">¡EMPEZAR AVENTURA!</span>
              <span className="button-icon"></span>
            </>
          )}
        </button>

        {/* Info adicional con diseño mejorado */}
        <div className="info-text">
          <span className="info-icon">💡</span>
          Crea tu identidad con mínimo 3 caracteres
        </div>

        {/* Decoración inferior */}
        <div className="card-footer-decoration">
          <span>⚔️</span>
          <span>🏆</span>
          <span>⚔️</span>
        </div>
      </div>
    </div>
  );
};


