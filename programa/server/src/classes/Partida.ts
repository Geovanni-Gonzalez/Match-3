import { Configuracion } from '../Interfaces';
import { Jugador } from './Jugador';
import { Tablero } from './Tablero';
import { WorkerThreadUtility } from '../worker/workerUtility';

export class Partida {
    public estado: 'espera' | 'jugando' | 'finalizada' = 'espera';
    public jugadores: Map<string, Jugador> = new Map();
    public tablero: Tablero;
    public cronometro: ReturnType<typeof setInterval> | null = null;
    private config: Configuracion;

    constructor(
        public idPartida: string,
        public tipoJuego: 'Match' | 'Tiempo',
        public tematica: string,
        private numJugadoresMax: number,
        config: Configuracion
    ) {
        this.config = config;
        this.tablero = new Tablero(config);
    }

    public agregarJugador(jugador: Jugador): void {
        if (this.estado !== 'espera' || this.jugadores.size >= this.numJugadoresMax) {
            throw new Error("No se puede unir a esta partida.");
        }
        this.jugadores.set(jugador.nickname, jugador);
        if (this.jugadores.size === this.numJugadoresMax) {
            this.iniciarJuego(); // Inicia el juego si la sala está llena
        }
        this.enviarEstadoATodos();
    }

    public iniciarJuego(): void {
        this.estado = 'jugando';
        // Lógica de inicio de cronómetros (REQ-028)
    }
    
    // Método llamado por el ServidorPartidas al evento 'activar_match'
    public async procesarMatch(nickname: string): Promise<void> {
        const jugador = this.jugadores.get(nickname);
        if (!jugador || jugador.celdasSeleccionadas.length < 3) return; // Validación rápida

        // 1. Ejecutar la validación en el Worker Thread
        const resultado = await WorkerThreadUtility.validarCadena(
            jugador.celdasSeleccionadas,
            this.tablero.matriz
        );
        
        // 2. Procesar el resultado
        if (resultado.valido) {
            jugador.calcularPuntaje(resultado.n); // REQ-027
            this.tablero.actualizarCeldas(resultado.celdas); // REQ-026
        }

        // 3. Limpiar selecciones
        jugador.limpiarSelecciones();
        this.tablero.matriz.forEach(row => row.forEach(celda => celda.establecerEstado('libre')));
        this.enviarEstadoATodos();
    }

    public finalizarJuego(): void {
        if (this.estado === 'finalizada') return;

        this.estado = 'finalizada';
        if (this.cronometro) clearInterval(this.cronometro);

        // REQ-030: Determinación de Posiciones
        const resultadosOrdenados = Array.from(this.jugadores.values())
            .sort((a, b) => b.puntaje - a.puntaje);
        
        const ganador = resultadosOrdenados[0];
        
        // Persistencia de Estadísticas (REQ-031, REQ-032)
        this.jugadores.forEach(jugador => {
            const esGanador = (ganador.puntaje > 0) && (jugador.puntaje === ganador.puntaje);
            jugador.guardarEstadisticas(this.idPartida, esGanador);
        });

        this.enviarEstadoATodos(); // Notificar resultados finales
    }

    public enviarEstadoATodos(): void {
        // Lógica real: io.to(this.idPartida).emit('estado_partida_actualizado', ...);
        console.log(`[SOCKET.IO] Enviando estado actualizado a la sala ${this.idPartida}.`);
    }
}