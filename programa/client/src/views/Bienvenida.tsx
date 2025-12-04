// client/src/views/Bienvenida.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; 
import axios from 'axios';
import '../styles/Bienvenida.css';

const API_URL = 'http://localhost:4000/api';

export const Bienvenida: React.FC = () => {
  const { login } = useAuth();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (nickname.trim().length < 3) {
      setError("El nickname debe tener al menos 3 caracteres.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      console.log("[Cliente] Registrando jugador...");

      const res = await axios.post(`${API_URL}/jugador/registrar`, { nickname });
      const jugadorId = res.data.jugadorId;

      console.log(`[Cliente] Jugador registrado con ID DB: ${jugadorId}`);

      // Iniciar sesión (activa el socket + guarda nickname)
      await login(nickname, jugadorId);

      console.log("[Cliente] Sesión establecida correctamente.");

    } catch (err) {
      console.error("[Cliente] Error al iniciar sesión:", err);

      const errMsg =
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Error en el servidor."
          : "Error desconocido.";

      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="bienvenida-container">
      {/* Fondo animado con gradiente dinámico */}
      <div className="animated-background"></div>
      
      {/* Partículas brillantes flotantes */}
      {[...Array(30)].map((_, i) => (
        <div 
          key={`particle-${i}`}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
      
      {/* Gemas decorativas flotantes - estilo Match-3 */}
      <div className="gem gem-red" style={{top: '10%', left: '10%', animationDelay: '0s'}}>💎</div>
      <div className="gem gem-blue" style={{top: '15%', right: '15%', animationDelay: '1s'}}>💠</div>
      <div className="gem gem-green" style={{bottom: '20%', left: '8%', animationDelay: '2s'}}>🔷</div>
      <div className="gem gem-yellow" style={{top: '60%', right: '10%', animationDelay: '1.5s'}}>⭐</div>
      <div className="gem gem-purple" style={{bottom: '10%', right: '20%', animationDelay: '0.5s'}}>🔮</div>
      <div className="gem gem-orange" style={{top: '40%', left: '5%', animationDelay: '2.5s'}}>🧡</div>
      
      {/* Burbujas decorativas */}
      {[...Array(8)].map((_, i) => (
        <div 
          key={`bubble-${i}`}
          className="bubble"
          style={{
            left: `${10 + i * 12}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${6 + Math.random() * 3}s`,
          }}
        />
      ))}
      
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


