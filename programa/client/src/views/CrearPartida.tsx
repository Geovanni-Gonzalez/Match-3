// client/src/views/CrearPartida.tsx

import React, { useState } from 'react';

// --- Interfaces de Tipos ---
interface CrearPartidaProps {
  onBack: () => void; // Función para regresar al menú principal
  onCreateSuccess: (partidaId: string) => void; // Función al crear exitosamente
}

export const CrearPartida: React.FC<CrearPartidaProps> = ({ onBack, onCreateSuccess }) => {
  const [tipoJuego, setTipoJuego] = useState<'Match' | 'Tiempo'>('Match'); // Default "Match"
  const [tematica, setTematica] = useState<string>('Gemas'); // Default "Match" (interpretado como Temática)
  const [numJugadores, setNumJugadores] = useState<number>(2); // Default 2, REQ-008
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Opciones para los selectores (REQ-003 COLORES_VALIDOS para temática)
  const opcionesTematica = ['Gemas', 'Monstruos', 'Frutas', 'Animales']; // Mock de temáticas
  const opcionesTipoJuego = [
    { value: 'Match', label: 'Match' }, 
    { value: 'Tiempo', label: 'Tiempo' }
  ];

  const handleCrearPartida = async () => {
    setError(null);
    setLoading(true);

    try {
      // REQ-007: Llama a la ruta REST para crear una partida (POST /api/partidas)
      const response = await fetch('http://localhost:4000/api/partidas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipoJuego: tipoJuego,
          tematica: tematica,
          numJugadoresMax: numJugadores, // REQ-008
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Partida creada! Código: ${data.codigo}`);
        onCreateSuccess(data.codigo); // Notifica al padre con el código de la partida creada
      } else {
        setError(data.message || 'Error al crear la partida.');
      }
    } catch (e) {
      setError('Fallo de conexión con el servidor backend.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.windowFrame}>
      {/* Botón de retroceso */}
      <div style={styles.backButton} onClick={onBack}>
        &larr;
      </div>
      
      <div style={styles.header}>
        <h1 style={styles.title}>Crear partida</h1>
      </div>

      <div style={styles.content}>
        {/* Tipo de juego */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Tipo de juego:</label>
          <select 
            value={tipoJuego} 
            onChange={(e) => setTipoJuego(e.target.value as 'Match' | 'Tiempo')}
            style={styles.select}
          >
            {opcionesTipoJuego.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

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

        {/* N° de jugadores */}
        <div style={styles.formGroup}>
          <label style={styles.label}>N° de jugadores:</label>
          <input 
            type="number" 
            value={numJugadores} 
            onChange={(e) => setNumJugadores(Math.max(2, parseInt(e.target.value) || 2))} // Mínimo 2
            min="2" // REQ-008: Mínimo 2 jugadores
            max="6" // Máximo de 6 jugadores (ejemplo)
            style={styles.numberInput}
          />
        </div>

        {error && <p style={styles.errorText}>Error: {error}</p>}

        <button 
          onClick={handleCrearPartida} 
          disabled={loading} 
          style={styles.continueButton}
        >
          {loading ? 'Creando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  windowFrame: {
    padding: '20px',
    borderRadius: '10px',
    backgroundColor: '#333744',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
    width: '400px', 
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'white',
  },
  backButton: {
    position: 'absolute',
    top: '15px',
    left: '15px',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: '5px',
    color: '#61dafb',
  },
  header: {
    width: '100%',
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    color: '#61dafb',
    margin: '0',
  },
  content: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 20px',
  },
  formGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: '20px',
  },
  label: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginRight: '15px',
    minWidth: '150px', // Para alinear etiquetas
    textAlign: 'left',
  },
  select: {
    flexGrow: 1, // Ocupa el espacio restante
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #555',
    backgroundColor: '#444857',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
  },
  numberInput: {
    flexGrow: 1,
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #555',
    backgroundColor: '#444857',
    color: 'white',
    fontSize: '16px',
    textAlign: 'center', // Para números
  },
  errorText: {
    color: '#ff6b6b',
    margin: '20px 0',
  },
  continueButton: {
    padding: '12px 30px',
    backgroundColor: '#4CAF50', // Verde como en el wireframe
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: '30px',
    transition: 'background-color 0.2s',
  },
};