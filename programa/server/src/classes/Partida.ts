import { Configuracion } from '../interfaces';
import { Jugador } from './Jugador';
import { Tablero } from './Tablero';
import { WorkerThreadUtility } from '../worker/workerUtility';

/**
 * Clase que representa una partida del juego Match-3
 * REQ-007, REQ-008, REQ-012
 */
export class Partida {
    public estado: 'espera' | 'jugando' | 'finalizada' = 'espera';
    public jugadores: Map<string, Jugador> = new Map();
    public tablero: Tablero;
    public cronometro: ReturnType<typeof setInterval> | null = null;
    private config: Configuracion;
    private fechaCreacion: Date;
    private duracionMinutos?: number;

    constructor(
        public idPartida: string,
        public tipoJuego: 'Match' | 'Tiempo',
        public tematica: string,
        private numJugadoresMax: number,
        config: Configuracion,
        duracionMinutos?: number
    ) {
        this.config = config;
        this.tablero = new Tablero(config);
        this.fechaCreacion = new Date();
        this.duracionMinutos = duracionMinutos;
        
        console.log(`[Partida ${idPartida}] Creada con éxito`);
        console.log(`  - Tipo: ${tipoJuego}`);
        console.log(`  - Temática: ${tematica}`);
        console.log(`  - Jugadores máx: ${numJugadoresMax}`);
        console.log(`  - Duración: ${duracionMinutos ? duracionMinutos + ' min' : 'N/A'}`);
    }

    /**
     * Agrega un jugador a la partida
     * REQ-012: Usuarios en espera de completar número de jugadores
     */
    public agregarJugador(jugador: Jugador): void {
        console.log(`\n[Partida ${this.idPartida}] Intentando agregar jugador: ${jugador.nickname}`);
        
        // Validar que la partida esté en espera
        if (this.estado !== 'espera') {
            console.log(`[Partida ${this.idPartida}] ✗ Error: Partida no está en espera (estado: ${this.estado})`);
            throw new Error("No se puede unir a esta partida. Ya inició o finalizó.");
        }
        
        // Validar que haya espacio
        if (this.jugadores.size >= this.numJugadoresMax) {
            console.log(`[Partida ${this.idPartida}] ✗ Error: Partida llena (${this.jugadores.size}/${this.numJugadoresMax})`);
            throw new Error("La partida está llena.");
        }
        
        // Validar que el nickname no esté repetido
        if (this.jugadores.has(jugador.nickname)) {
            console.log(`[Partida ${this.idPartida}] ✗ Error: Nickname ya existe`);
            throw new Error("Ya existe un jugador con ese nickname en la partida.");
        }
        
        // Agregar jugador
        this.jugadores.set(jugador.nickname, jugador);
        console.log(`[Partida ${this.idPartida}] ✓ Jugador agregado: ${jugador.nickname}`);
        console.log(`[Partida ${this.idPartida}] Jugadores: ${this.jugadores.size}/${this.numJugadoresMax}`);
        
        // Verificar si la partida está completa (REQ-012)
        if (this.jugadores.size === this.numJugadoresMax) {
            console.log(`[Partida ${this.idPartida}] ✓ Partida completa. Iniciando juego...`);
            this.iniciarJuego();
        } else {
            console.log(`[Partida ${this.idPartida}] Esperando más jugadores...`);
        }
        
        this.enviarEstadoATodos();
    }

    /**
     * Inicia el juego cuando se completa el número de jugadores
     * REQ-012: La partida solo cambia de estado cuando la cantidad de usuarios unidos es igual a la configurada
     */
    public iniciarJuego(): void {
        console.log(`\n========== INICIO DE JUEGO ==========`);
        console.log(`[Partida ${this.idPartida}] Cambiando estado: espera -> jugando`);
        
        this.estado = 'jugando';
        
        console.log(`[Partida ${this.idPartida}] Jugadores en partida:`);
        this.jugadores.forEach((jugador, nickname) => {
            console.log(`  - ${nickname} (Socket: ${jugador.socketID})`);
        });
        
        // Configurar cronómetro si es tipo Tiempo (REQ-028)
        if (this.tipoJuego === 'Tiempo' && this.duracionMinutos) {
            this.configurarCronometroTiempo();
        }
        
        console.log(`[Partida ${this.idPartida}] ✓ Juego iniciado exitosamente`);
        console.log('====================================\n');
    }

    /**
     * Configura el cronómetro para partidas de tipo Tiempo
     */
    private configurarCronometroTiempo(): void {
        if (!this.duracionMinutos) return;
        
        const duracionMs = this.duracionMinutos * 60 * 1000;
        console.log(`[Partida ${this.idPartida}] Cronómetro configurado: ${this.duracionMinutos} minutos`);
        
        setTimeout(() => {
            console.log(`[Partida ${this.idPartida}] Tiempo agotado. Finalizando partida...`);
            this.finalizarJuego();
        }, duracionMs);
    }
    
    /**
     * Procesa la validación de matches de un jugador usando Worker Thread
     */
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

    /**
     * Finaliza el juego y calcula resultados
     * REQ-030: Determinación de posiciones
     * REQ-031, REQ-032: Persistencia de estadísticas
     */
    public finalizarJuego(): void {
        if (this.estado === 'finalizada') return;

        console.log(`\n========== FINALIZACIÓN DE JUEGO ==========`);
        console.log(`[Partida ${this.idPartida}] Finalizando partida...`);

        this.estado = 'finalizada';
        if (this.cronometro) clearInterval(this.cronometro);

        // REQ-030: Determinación de Posiciones
        const resultadosOrdenados = Array.from(this.jugadores.values())
            .sort((a, b) => b.puntaje - a.puntaje);
        
        console.log(`[Partida ${this.idPartida}] Resultados finales:`);
        resultadosOrdenados.forEach((jugador, index) => {
            console.log(`  ${index + 1}. ${jugador.nickname}: ${jugador.puntaje} puntos`);
        });
        
        const ganador = resultadosOrdenados[0];
        console.log(`[Partida ${this.idPartida}] 🏆 Ganador: ${ganador.nickname}`);
        
        // Persistencia de Estadísticas (REQ-031, REQ-032)
        this.jugadores.forEach(jugador => {
            const esGanador = (ganador.puntaje > 0) && (jugador.puntaje === ganador.puntaje);
            jugador.guardarEstadisticas(this.idPartida, esGanador);
        });

        console.log(`[Partida ${this.idPartida}] ✓ Partida finalizada`);
        console.log('===========================================\n');

        this.enviarEstadoATodos(); // Notificar resultados finales
    }

    /**
     * Envía el estado actualizado a todos los jugadores
     * REQ-011: Actualización constante de información
     */
    public enviarEstadoATodos(): void {
        // Lógica real: io.to(this.idPartida).emit('estado_partida_actualizado', ...);
        console.log(`[Partida ${this.idPartida}] 📡 Estado enviado a todos los jugadores`);
    }

    /**
     * Obtiene información completa de la partida
     * REQ-011: Información completa de partidas disponibles
     */
    public obtenerInformacion(): {
        id: string;
        tipo: string;
        tematica: string;
        jugadoresActuales: number;
        jugadoresMaximos: number;
        tiempoRestanteSegundos: number;
        jugadoresNombres: string[];
    } {
        const tiempoTranscurridoMs = Date.now() - this.fechaCreacion.getTime();
        const tiempoLimiteMs = this.config.TIEMPO_VIDA_PARTIDA_MIN * 60 * 1000;
        const tiempoRestanteMs = Math.max(0, tiempoLimiteMs - tiempoTranscurridoMs);
        const tiempoRestanteSegundos = Math.floor(tiempoRestanteMs / 1000);

        return {
            id: this.idPartida,
            tipo: this.tipoJuego,
            tematica: this.tematica,
            jugadoresActuales: this.jugadores.size,
            jugadoresMaximos: this.numJugadoresMax,
            tiempoRestanteSegundos: tiempoRestanteSegundos,
            jugadoresNombres: Array.from(this.jugadores.keys())
        };
    }

    /**
     * Obtiene el número máximo de jugadores
     */
    public getNumJugadoresMax(): number {
        return this.numJugadoresMax;
    }

    /**
     * Obtiene el estado actual de la partida
     */
    public getEstado(): 'espera' | 'jugando' | 'finalizada' {
        return this.estado;
    }

    /**
     * Obtiene la configuración de la partida
     */
    public getConfiguracion(): Configuracion {
        return this.config;
    }
}