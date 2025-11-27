// client/src/views/Bienvenida.tsx
import React, { useState } from 'react';

interface BienvenidaProps {
  onLoginSuccess: (nickname: string) => void;
}

export const Bienvenida: React.FC<BienvenidaProps> = ({ onLoginSuccess }) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (nickname.trim().length < 3) {
      setError('El nickname debe tener al menos 3 caracteres.');
      return;
    }
    setError('');

    // --- Simulación de Autenticación / Registro (POST /api/login o POST /api/join) ---
    console.log(`Intentando autenticar a: ${nickname}`);

    try {
        // En un proyecto real, se haría una llamada fetch o axios al backend:
        /*
        const response = await fetch('http://localhost:4000/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname }),
        });
        const data = await response.json();
        if (response.ok) {
            onLoginSuccess(data.nickname); // Usar data real del servidor
        } else {
            setError(data.message || 'Error de servidor.');
        }
        */

        // SIMULACIÓN EXITOSA:
        setTimeout(() => {
            onLoginSuccess(nickname);
        }, 500);

    } catch (e) {
      setError('No se pudo conectar con el servidor.');
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

      <button onClick={handleLogin} disabled={nickname.trim().length < 3} style={styles.button}>
        Empezar
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