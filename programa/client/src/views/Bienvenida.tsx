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
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <Background />

      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Shine Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>

        {/* Title Section */}
        <div className="text-center mb-8 relative">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg border border-white/20 animate-pulse">
              <div className="text-3xl">💎</div>
            </div>
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2 drop-shadow-lg">
            Match-3
          </h1>
          <p className="text-sm font-bold tracking-[0.3em] text-blue-200/60 uppercase">Legendary Puzzle</p>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto mt-4 rounded-full"></div>
        </div>

        <p className="text-center text-blue-100/80 mb-8 font-medium">✨ ¡Compite contra tus amigos! ✨</p>

        {/* Input */}
        <div className="relative group mb-6">
          <input
            type="text"
            placeholder="Tu nombre de jugador legendario"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all text-center font-bold tracking-wide"
            maxLength={20}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-600 group-focus-within:w-full transition-all duration-300"></div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center justify-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg text-sm font-bold mb-6 border border-red-500/20 animate-bounce">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={nickname.trim().length < 3 || isLoading}
          className={`w-full relative overflow-hidden group py-4 rounded-xl font-bold tracking-wider transition-all duration-300 ${nickname.trim().length < 3 ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02]'}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>CONECTANDO...</span>
            </div>
          ) : (
            <span className="relative z-10">¡EMPEZAR AVENTURA!</span>
          )}
          {/* Button Glow on Hover */}
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
        </button>

        {/* Info */}
        <div className="text-center mt-6 text-xs text-white/40 flex items-center justify-center gap-2">
          <span>💡</span>
          Crea tu identidad con mínimo 3 caracteres
        </div>

        {/* Footer Decoration */}
        <div className="flex justify-center gap-6 mt-8 opacity-30 text-2xl grayscale hover:grayscale-0 transition-all duration-500">
          <span>⚔️</span>
          <span>🏆</span>
          <span>⚔️</span>
        </div>
      </div>
    </div>
  );
};


