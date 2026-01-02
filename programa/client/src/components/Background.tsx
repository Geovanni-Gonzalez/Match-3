/**
 * @file Background.tsx
 * @description Componente reutilizable para el fondo animado de la aplicación.
 * Incluye gradiente animado, partículas, gemas flotantes y burbujas.
 */

import React from 'react';
import '../styles/Background.css';

export const Background: React.FC = () => {
  return (
    <>
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
      <div className="gem gem-red" style={{ top: '10%', left: '10%', animationDelay: '0s' }}>💎</div>
      <div className="gem gem-blue" style={{ top: '15%', right: '15%', animationDelay: '1s' }}>💠</div>
      <div className="gem gem-green" style={{ bottom: '20%', left: '8%', animationDelay: '2s' }}>🔷</div>
      <div className="gem gem-yellow" style={{ top: '60%', right: '10%', animationDelay: '1.5s' }}>⭐</div>
      <div className="gem gem-purple" style={{ bottom: '10%', right: '20%', animationDelay: '0.5s' }}>🔮</div>
      <div className="gem gem-orange" style={{ top: '40%', left: '5%', animationDelay: '2.5s' }}>🧡</div>

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
    </>
  );
};
