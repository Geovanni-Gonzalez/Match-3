// client/src/views/Bienvenida.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface BienvenidaProps {
  onLoginSuccess: (nickname: string) => void;
}

export const Bienvenida: React.FC<BienvenidaProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (nickname.trim().length < 3) {
      setError('El nickname debe tener al menos 3 caracteres.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      console.log(`[BIENVENIDA] Autenticando a: ${nickname}`);
      
      // Usar el contexto de autenticación para hacer login
      await login(nickname);
      
      console.log('[BIENVENIDA] Autenticación exitosa');
      onLoginSuccess(nickname);
    } catch (e) {
      setError('No se pudo conectar con el servidor.');
      console.error('[BIENVENIDA] Error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h1>Match-3</h1>
      <p>Bienvenido(a) al juego multijugador Match-3</p>

      <input
        type="text"
        placeholder="Ingresar nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        style={styles.input}
      />
      
      {error && <p style={styles.errorText}>⚠️ {error}</p>}

      <button 
        onClick={handleLogin} 
        disabled={nickname.trim().length < 3 || loading} 
        style={styles.button}
      >
        {loading ? 'Conectando...' : 'Empezar'}
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    card: {
        padding: '40px',
        borderRadius: '10px',
        backgroundColor: '#333744',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        width: '350px',
    },
    input: {
        padding: '10px',
        margin: '15px 0',
        width: 'calc(100% - 20px)',
        borderRadius: '5px',
        border: '1px solid #555',
        fontSize: '16px',
        textAlign: 'center',
    },
    button: {
        padding: '10px 20px',
        backgroundColor: '#61dafb',
        color: '#282c34',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        marginTop: '10px',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: '14px',
    },
};