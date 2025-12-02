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
        disabled={nickname.trim().length < 3 || isLoading}
        style={{
          ...styles.button,
          opacity: isLoading ? 0.5 : 1,
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "Conectando..." : "Empezar"}
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    padding: "40px",
    borderRadius: "10px",
    backgroundColor: "#333744",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
    width: "350px",
    textAlign: "center",
    color: "white",
  },
  input: {
    padding: "10px",
    margin: "15px 0",
    width: "calc(100% - 20px)",
    borderRadius: "5px",
    border: "1px solid #555",
    fontSize: "16px",
    textAlign: "center",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#61dafb",
    color: "#282c34",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "10px",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: "14px",
  },
};
