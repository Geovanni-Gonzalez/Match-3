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
  const [duracion, setDuracion] = useState<number>(5); // Default 5 mins
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
    setError(null);
    setLoading(true);



    try {
      const response = await axios.post(`${API_URL}/partida/crear_partida`, {
        tipoJuego,
        tematica,
        numJugadoresMax: numJugadores,
        duracionMinutos: tipoJuego === 'Tiempo' ? duracion : 0
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
    <div style={styles.windowFrame}>
      <div style={styles.backButton} onClick={onBack}>&larr;</div>

      <div style={styles.header}>
        <h1 style={styles.title}>Crear partida</h1>
      </div>

      <div style={styles.content}>

        {/* Tipo de juego */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Tipo de juego:</label>
          <select
            value={tipoJuego}
            onChange={(e) => setTipoJuego(e.target.value as any)}
            style={styles.select}
          >
            {opcionesTipoJuego.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Duración (Solo si es Tiempo) */}
        {tipoJuego === 'Tiempo' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Duración (min):</label>
            <input
              type="number"
              min={1}
              max={60}
              value={duracion}
              onChange={(e) => setDuracion(Math.max(1, Number(e.target.value)))}
              style={styles.numberInput}
            />
          </div>
        )}

        {/* Temática */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Temática:</label>
          <select
            value={tematica}
            onChange={(e) => setTematica(e.target.value)}
            style={styles.select}
          >
            {opcionesTematica.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Jugadores */}
        <div style={styles.formGroup}>
          <label style={styles.label}>N° jugadores:</label>
          <input
            type="number"
            min={2}
            max={6}
            value={numJugadores}
            onChange={(e) => setNumJugadores(Math.max(2, Number(e.target.value)))}
            style={styles.numberInput}
          />
        </div>

        {error && <p style={styles.errorText}>Error: {error}</p>}

        <button
          onClick={handleCrearPartida}
          disabled={loading}
          style={styles.continueButton}
        >
          {loading ? "Creando..." : "Crear Partida"}
        </button>

      </div>
    </div >
  );
};

// -------------------------------
// ESTILOS
// -------------------------------
const styles: { [key: string]: React.CSSProperties } = {
  windowFrame: {
    padding: "20px",
    borderRadius: "10px",
    backgroundColor: "#333744",
    boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
    width: "400px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "white"
  },
  backButton: {
    position: "absolute",
    top: "15px",
    left: "15px",
    fontSize: "24px",
    cursor: "pointer",
    color: "#61dafb"
  },
  header: { width: "100%", textAlign: "center", marginBottom: "30px" },
  title: { fontSize: "28px", color: "#61dafb" },
  content: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "0 20px"
  },
  formGroup: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px"
  },
  label: { fontWeight: "bold", minWidth: "140px" },
  select: {
    flexGrow: 1,
    padding: "10px",
    backgroundColor: "#444857",
    color: "white",
    borderRadius: "5px",
    border: "1px solid #555"
  },
  numberInput: {
    flexGrow: 1,
    padding: "10px",
    backgroundColor: "#444857",
    color: "white",
    borderRadius: "5px",
    border: "1px solid #555",
    textAlign: "center"
  },
  errorText: { color: "#ff6b6b" },
  continueButton: {
    marginTop: "30px",
    padding: "12px 30px",
    backgroundColor: "#4CAF50",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "18px",
    cursor: "pointer"
  }
};
