// client/src/views/Bienvenida.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; 
import axios from 'axios';

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

  return (
    <div style={styles.container}>
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
      
      <div style={styles.card} className="welcome-card">
        {/* Brillo superior del card */}
        <div className="card-shine"></div>
        
        {/* Logo/Título con efecto premium */}
        <div style={styles.titleContainer}>
          <div className="logo-container">
            <div className="logo-glow"></div>
            <div style={styles.logoIcon}>💎</div>
          </div>
          <h1 style={styles.title} className="animated-title">Match-3</h1>
          <p className="title-shadow">LEGENDARY PUZZLE</p>
          <div style={styles.titleUnderline} className="title-underline"></div>
        </div>

        <p style={styles.subtitle}>✨¡Compite contra tus amigos!✨</p>

        {/* Input con diseño premium */}
        <div style={styles.inputContainer} className="input-wrapper">
          <div style={styles.inputIcon}>👤</div>
          <input
            type="text"
            placeholder="Tu nombre de jugador legendario"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyPress={handleKeyPress}
            style={styles.input}
            className="input-modern premium-input"
            maxLength={20}
          />
          <div className="input-border-animation"></div>
        </div>
        
        {/* Mensaje de error mejorado */}
        {error && (
          <div style={styles.errorContainer}>
            <span style={styles.errorIcon}>⚠️</span>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        {/* Botón premium con efectos avanzados */}
        <button 
          onClick={handleLogin} 
          disabled={nickname.trim().length < 3 || loading} 
          className="button-shine premium-button"
          style={{
            ...styles.button,
            ...(nickname.trim().length < 3 || loading ? styles.buttonDisabled : {})
          }}
          onMouseEnter={(e) => {
            if (nickname.trim().length >= 3 && !loading) {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          <div className="button-glow"></div>
          {loading ? (
            <>
              <span style={styles.spinner}></span>
              <span className="button-loading-text">Conectando al servidor...</span>
            </>
          ) : (
            <>
              <span style={styles.buttonText}>¡EMPEZAR AVENTURA!</span>
              <span style={styles.buttonIcon}></span>
            </>
          )}
        </button>

        {/* Info adicional con diseño mejorado */}
        <div style={styles.infoText}>
          <span style={styles.infoIcon}>💡</span>
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

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 1,
    padding: '20px',
  },
  card: {
    position: 'relative',
    padding: '55px 45px 45px',
    borderRadius: '35px',
    background: 'rgba(30, 27, 75, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    boxShadow: `
      0 30px 90px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(167, 139, 250, 0.3) inset,
      0 0 60px rgba(139, 92, 246, 0.4),
      0 8px 32px rgba(124, 58, 237, 0.3)
    `,
    width: '480px',
    maxWidth: '92vw',
    border: '3px solid transparent',
    backgroundImage: `
      linear-gradient(rgba(30, 27, 75, 0.85), rgba(30, 27, 75, 0.9)),
      linear-gradient(135deg, #7c3aed, #8b5cf6, #a78bfa, #c4b5fd)
    `,
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box',
    zIndex: 10,
    overflow: 'visible',
  },
  titleContainer: {
    marginBottom: '15px',
    position: 'relative',
    textAlign: 'center',
  },
  logoIcon: {
    fontSize: '80px',
    marginBottom: '15px',
    display: 'inline-block',
    animation: 'logoFloat 3s ease-in-out infinite',
    filter: 'drop-shadow(0 8px 16px rgba(102, 126, 234, 0.5))',
    position: 'relative',
    zIndex: 2,
  },
  title: {
    fontSize: '56px',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 30%, #ddd6fe 60%, #ede9fe 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '10px 0 5px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    position: 'relative',
    filter: 'drop-shadow(0 4px 12px rgba(167, 139, 250, 0.5))',
  },
  titleUnderline: {
    width: '120px',
    height: '5px',
    background: 'linear-gradient(90deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
    margin: '12px auto',
    borderRadius: '3px',
    boxShadow: '0 4px 8px rgba(139, 92, 246, 0.4)',
  },
  subtitle: {
    fontSize: '17px',
    color: '#c4b5fd',
    marginBottom: '40px',
    fontWeight: '700',
    textShadow: '0 2px 4px rgba(167, 139, 250, 0.3)',
    letterSpacing: '0.5px',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: '20px',
  },
  inputIcon: {
    position: 'absolute',
    left: '22px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '26px',
    zIndex: 2,
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
  },
  input: {
    width: '100%',
    padding: '22px 25px 22px 65px',
    borderRadius: '18px',
    border: '3px solid #4c1d95',
    fontSize: '17px',
    fontWeight: '600',
    textAlign: 'left',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    color: '#e0e7ff',
    outline: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(139, 92, 246, 0.1)',
    position: 'relative',
    zIndex: 1,
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '22px 35px',
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '18px',
    cursor: 'pointer',
    fontSize: '19px',
    fontWeight: '800',
    marginTop: '15px',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 12px 35px rgba(220, 38, 38, 0.4), 0 6px 12px rgba(153, 27, 27, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    position: 'relative',
    overflow: 'hidden',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  buttonDisabled: {
    background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    cursor: 'not-allowed',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transform: 'none !important',
  },
  buttonText: {
    position: 'relative',
    zIndex: 2,
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  buttonIcon: {
    fontSize: '24px',
    animation: 'iconBounce 1.5s ease-in-out infinite',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'rotate 1s linear infinite',
    display: 'inline-block',
  },
  errorContainer: {
    background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
    padding: '15px 22px',
    borderRadius: '15px',
    marginBottom: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '3px solid #b91c1c',
    animation: 'shake 0.5s ease-in-out',
    boxShadow: '0 4px 12px rgba(127, 29, 29, 0.3)',
  },
  errorIcon: {
    fontSize: '24px',
  },
  errorText: {
    color: '#fecaca',
    fontSize: '15px',
    fontWeight: '700',
    flex: 1,
    textAlign: 'left',
  },
  infoText: {
    marginTop: '25px',
    fontSize: '14px',
    color: '#c4b5fd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '600',
    textShadow: '0 1px 2px rgba(167, 139, 250, 0.3)',
  },
  infoIcon: {
    fontSize: '16px',
  },
};
