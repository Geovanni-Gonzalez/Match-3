// server/src/classes/ServidorPartidas.ts
import { Configuracion } from '../interfaces';
import { Partida } from './Partida';
import { Jugador } from './Jugador'; // Se usa al unirse a la partida

// MOCK: Simulación de carga del archivo config.json
const MOCK_CONFIG: Configuracion = {
    TIEMPO_VIDA_PARTIDA_MIN: 3,
    MATCH_FINITO_LIMITE: 100,
    TAMANIO_FILA: 9,
    TAMANIO_COLUMNA: 7,
    COLORES_VALIDOS: ["red", "blue", "green", "yellow", "purple", "orange"],
    TIEMPO_MATCH_ACTIVATE_MS: 2000,
};

export class ServidorPartidas {
    private static instance: ServidorPartidas;
    public partidasActivas: Map<string, Partida> = new Map();
    private config: Configuracion;
    
    private constructor(config: Configuracion) {
        this.config = config;
    }

    public static getInstance(): ServidorPartidas {
        if (!ServidorPartidas.instance) {
            ServidorPartidas.instance = new ServidorPartidas(MOCK_CONFIG); 
        }
        return ServidorPartidas.instance;
    }

    public obtenerConfiguracion(): Configuracion {
    return this.config;
    }

    public manejarDesconexionJugador(socketID: string): void {
    for (const [id, partida] of this.partidasActivas.entries()) {
        const jugador = partida.jugadores.get(socketID);
        
        if (jugador) {
           // partida.eliminarJugador(socketID); // Debes implementar este método en Partida
            
            // Si la partida queda vacía, la eliminamos
            if (partida.jugadores.size === 0) {
                this.partidasActivas.delete(id);
                // NOTA: Una emisión de "partida cerrada" podría ir aquí si tienes acceso a `io`
            }
            break; 
        }
    }
}

    public crearPartida(idPartida: string, tipo: 'Match' | 'Tiempo', tematica: string, max: number): Partida {
        
        // Crea y almacena la nueva partida
        const nuevaPartida = new Partida(idPartida, tipo, tematica, max, this.config);
        this.partidasActivas.set(idPartida, nuevaPartida);
        return nuevaPartida;
    }
    
    public unirseAPartida(idPartida: string, nickname: string, socketID: string, jugadorDBId: number): Jugador {
        const partida = this.partidasActivas.get(idPartida);
        if (!partida) {
            throw new Error('[ServidorPartidas] Partida no encontrada o ya finalizada.');
        }
        const nuevoJugador = new Jugador(nickname, jugadorDBId, socketID);
        partida.agregarJugador(nuevoJugador);
        return nuevoJugador;
    }

    public obtenerPartidasDisponibles(): { id: string, tipo: string, jugadores: number }[] {
        // REQ-011: Filtra solo las partidas en estado 'espera'
        return Array.from(this.partidasActivas.values())
            .filter(p => p.estado === 'espera')
            .map(p => ({
                id: p.idPartida,
                tipo: p.tipoJuego,
                jugadores: p.jugadores.size,
            }));
    }
    
    public manejarConexionSocket(socketID: string): void {
        // Lógica de Socket.IO para el manejo de eventos
    }
}