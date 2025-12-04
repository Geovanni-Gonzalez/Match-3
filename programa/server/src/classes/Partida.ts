import { Configuracion, Coordenada } from '../interfaces';
import { Jugador } from './Jugador';
import { Tablero } from './Tablero';

export class Partida {
    public estado: 'espera' | 'jugando' | 'finalizada' = 'espera';
    public jugadores: Map<string, Jugador> = new Map();
    public tablero: Tablero;
    public cronometro: ReturnType<typeof setInterval> | null = null;
    private config: Configuracion;
    private fechaCreacion: Date;
    public duracionMinutos?: number;
    public matchesRealizados: number = 0; // Contador de matches totales
    public readonly MAX_MATCHES: number = 50; // Límite de matches para modo Match
    public codigoVisual?: string; // Código visual de 6 caracteres

    constructor(
        public idPartida: string,
        public tipoJuego: 'Match' | 'Tiempo',
        public tematica: string,
        private numJugadoresMax: number,
        config: Configuracion,
        duracionMinutos?: number,
        codigoVisual?: string
    ) {
        this.config = config;
        this.tablero = new Tablero(config);
        this.fechaCreacion = new Date();
        this.duracionMinutos = duracionMinutos;
        this.codigoVisual = codigoVisual;
    }

    public agregarJugador(jugador: Jugador): void {
        if (this.estado !== 'espera') throw new Error("Partida ya iniciada.");
        if (this.jugadores.size >= this.numJugadoresMax) throw new Error("Partida llena.");
        
        if (!this.jugadores.has(jugador.nickname)) {
             this.jugadores.set(jugador.nickname, jugador);
        }
        
        if (this.jugadores.size === this.numJugadoresMax) {
            this.iniciarJuego();
        }
    }

    public iniciarJuego(): void {
        this.estado = 'jugando';
        // El cronómetro se iniciará después de la cuenta regresiva
    }

    public iniciarCronometro(): void {
        if (this.tipoJuego === 'Tiempo' && this.duracionMinutos) {
            this.configurarCronometroTiempo();
        }
    }

    private configurarCronometroTiempo(): void {
        if (!this.duracionMinutos) return;
        setTimeout(() => {
            this.finalizarJuego();
        }, this.duracionMinutos * 60 * 1000);
    }

    /**
     * seleccionarCelda - Lógica de selección MANUAL "UNA POR UNA" (Cadena)
     */
    public seleccionarCelda(nickname: string, r: number, c: number): { 
        exito: boolean; 
        mensaje: string; 
        grupo?: Coordenada[] 
    } {
        const jugador = this.jugadores.get(nickname);
        if (!jugador) return { exito: false, mensaje: 'Jugador no encontrado' };

        const celda = this.tablero.obtenerCelda(r, c);
        if (!celda) return { exito: false, mensaje: 'Celda inválida' };

        // 1. Validar bloqueo ajeno
        if (celda.estaBloqueada() && celda.bloqueadaPor !== nickname) {
            return { exito: false, mensaje: `Bloqueada por ${celda.bloqueadaPor}` };
        }

        const seleccionActual = jugador.celdasSeleccionadas;

        // CASO A: Primera selección (Iniciar cadena)
        if (seleccionActual.length === 0) {
            celda.bloquearPara(nickname);
            celda.establecerEstado('seleccion_propia');
            jugador.celdasSeleccionadas.push({ r, c });
            
            return { exito: true, mensaje: 'Inicio de cadena', grupo: jugador.celdasSeleccionadas };
        }

        // CASO B: Interactuar con una celda ya seleccionada
        const indexEnSeleccion = seleccionActual.findIndex(coord => coord.r === r && coord.c === c);
        if (indexEnSeleccion !== -1) {
            // Si es la última agregada -> DESHACER (Deseleccionar)
            if (indexEnSeleccion === seleccionActual.length - 1) {
                celda.desbloquear();
                celda.establecerEstado('libre');
                jugador.celdasSeleccionadas.pop();
                return { exito: true, mensaje: 'Paso deshecho', grupo: jugador.celdasSeleccionadas };
            } else {
                return { exito: false, mensaje: 'Ya seleccionada' };
            }
        }

        // CASO C: Agregar nueva celda a la cadena
        // 1. Validar Adyacencia (Debe ser vecina de la ÚLTIMA seleccionada)
        const ultimaCelda = seleccionActual[seleccionActual.length - 1];
        if (!this.esAdyacente(ultimaCelda, { r, c })) {
            return { exito: false, mensaje: 'Debe ser adyacente a la última celda' };
        }

        // 2. Validar Color (Debe ser igual a la primera de la cadena)
        const primerCeldaCoord = seleccionActual[0];
        const celdaInicial = this.tablero.obtenerCelda(primerCeldaCoord.r, primerCeldaCoord.c);
        
        if (celdaInicial && celda.colorID !== celdaInicial.colorID) {
            return { exito: false, mensaje: 'Debe ser del mismo color' };
        }

        // Si pasa validaciones: Agregar a la cadena y bloquear
        celda.bloquearPara(nickname);
        celda.establecerEstado('seleccion_propia');
        jugador.celdasSeleccionadas.push({ r, c });

        return { 
            exito: true, 
            mensaje: `Cadena: ${jugador.celdasSeleccionadas.length} celdas`, 
            grupo: jugador.celdasSeleccionadas 
        };
    }

    // Helper para verificar vecindad (Horizontal, Vertical y Diagonal)
    private esAdyacente(c1: Coordenada, c2: Coordenada): boolean {
        const dr = Math.abs(c1.r - c2.r);
        const dc = Math.abs(c1.c - c2.c);
        return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
    }

    public cancelarSeleccion(nickname: string): { exito: boolean; mensaje: string } {
        this.limpiarSeleccionJugador(nickname);
        return { exito: true, mensaje: 'Selección cancelada' };
    }

    private limpiarSeleccionJugador(nickname: string): void {
        const jugador = this.jugadores.get(nickname);
        if (!jugador) return;

        jugador.celdasSeleccionadas.forEach(coord => {
            const celda = this.tablero.obtenerCelda(coord.r, coord.c);
            if (celda && celda.bloqueadaPor === nickname) {
                celda.desbloquear();
            }
        });
        jugador.limpiarSelecciones();
    }

    private limpiarSeleccionesAfectadas(celdasEliminadas: Coordenada[], nicknameQueHizoMatch: string): void {
        const celdasEliminadasSet = new Set(celdasEliminadas.map(c => `${c.r},${c.c}`));
        this.jugadores.forEach((jugador, nick) => {
            if (nick === nicknameQueHizoMatch) return;
            if (jugador.celdasSeleccionadas.some(c => celdasEliminadasSet.has(`${c.r},${c.c}`))) {
                this.limpiarSeleccionJugador(nick);
            }
        });
    }

    public confirmarMatch(nickname: string): { exito: boolean; mensaje: string; puntos?: number; juegoFinalizado?: boolean; ganador?: any } {
        const jugador = this.jugadores.get(nickname);
        if (!jugador) return { exito: false, mensaje: 'Error jugador' };

        // VALIDACIÓN DE CANTIDAD (> 3)
        if (jugador.celdasSeleccionadas.length < 3) {
            return { exito: false, mensaje: 'Mínimo 3 celdas requeridas' };
        }

        const n = jugador.celdasSeleccionadas.length;
        jugador.calcularPuntaje(n);
        
        const celdasEliminadas = [...jugador.celdasSeleccionadas];
        this.tablero.procesarMatchesEnCascada(jugador.celdasSeleccionadas);
        
        this.limpiarSeleccionJugador(nickname);
        this.limpiarSeleccionesAfectadas(celdasEliminadas, nickname);
        
        // Incrementar contador de matches
        this.matchesRealizados++;
        console.log(`[Partida ${this.idPartida}] Matches realizados: ${this.matchesRealizados}/${this.MAX_MATCHES}`);
        
        // Verificar si se alcanzó el límite de matches (solo en modo Match)
        if (this.tipoJuego === 'Match' && this.matchesRealizados >= this.MAX_MATCHES) {
            console.log(`[Partida ${this.idPartida}] ¡Límite de matches alcanzado! Finalizando juego...`);
            this.finalizarJuego();
            const ganador = this.obtenerGanador();
            return { 
                exito: true, 
                mensaje: `Match de ${n}! +${Math.pow(n, 2)} pts - ¡JUEGO FINALIZADO!`, 
                puntos: Math.pow(n, 2),
                juegoFinalizado: true,
                ganador
            };
        }
        
        return { 
            exito: true, 
            mensaje: `Match de ${n}! +${Math.pow(n, 2)} pts`, 
            puntos: Math.pow(n, 2) 
        };
    }

    public finalizarJuego(): void {
        if (this.estado === 'finalizada') return;
        this.estado = 'finalizada';
        if (this.cronometro) clearInterval(this.cronometro);
        
        const ranking = Array.from(this.jugadores.values()).sort((a, b) => b.puntaje - a.puntaje);
        
        // Detectar empate
        const puntajeMaximo = ranking[0].puntaje;
        const ganadores = ranking.filter(j => j.puntaje === puntajeMaximo);
        const esEmpate = ganadores.length > 1;
        
        // Calcular tiempo invertido en segundos
        const tiempoInvertidoMs = Date.now() - this.fechaCreacion.getTime();
        const tiempoInvertidoSegundos = Math.floor(tiempoInvertidoMs / 1000);
        
        this.jugadores.forEach(jugador => {
            // En caso de empate, todos los ganadores se marcan como ganadores
            const esGanador = ganadores.some(g => g.nickname === jugador.nickname) && jugador.puntaje > 0;
            jugador.guardarEstadisticas(this.idPartida, esGanador);
        });
        
        // Guardar estadísticas completas de la partida en JSON
        const { DBManager } = require('../db/dbManager');
        const nombresGanadores = esEmpate 
            ? ganadores.map(g => g.nickname).join(',')
            : ganadores[0].nickname;
            
        DBManager.guardarEstadisticasPartida(
            this.codigoVisual || this.idPartida, // Usar código visual si está disponible
            nombresGanadores,
            puntajeMaximo,
            this.tematica,
            tiempoInvertidoSegundos
        );
        
        console.log(`[Partida ${this.idPartida}] ========== JUEGO FINALIZADO ==========`);
        if (esEmpate) {
            console.log(`[Partida ${this.idPartida}] ¡EMPATE! Ganadores: ${nombresGanadores} con ${puntajeMaximo} puntos`);
        } else {
            console.log(`[Partida ${this.idPartida}] Ganador: ${ganadores[0].nickname} con ${puntajeMaximo} puntos`);
        }
        console.log(`[Partida ${this.idPartida}] Tiempo invertido: ${tiempoInvertidoSegundos}s`);
    }

    public obtenerGanador(): any {
        const ranking = Array.from(this.jugadores.values()).sort((a, b) => b.puntaje - a.puntaje);
        
        // Verificar si hay empate (múltiples jugadores con el puntaje más alto)
        const puntajeMaximo = ranking[0].puntaje;
        const ganadores = ranking.filter(j => j.puntaje === puntajeMaximo);
        const esEmpate = ganadores.length > 1;
        
        return {
            nickname: esEmpate 
                ? ganadores.map(g => g.nickname).join(',') 
                : ranking[0].nickname,
            puntaje: puntajeMaximo,
            esEmpate: esEmpate,
            ganadores: ganadores.map(g => ({ nickname: g.nickname, puntaje: g.puntaje })),
            ranking: ranking.map((j, index) => ({
                posicion: index + 1,
                nickname: j.nickname,
                puntaje: j.puntaje
            }))
        };
    }

    public enviarEstadoATodos(): void {
        // Placeholder
    }

    public obtenerEstadoTablero(): any {
        return this.tablero.matriz.map(f => f.map(c => ({
            fila: c.fila, columna: c.columna, colorID: c.colorID, estado: c.estado, bloqueadaPor: c.bloqueadaPor
        })));
    }

    public obtenerJugadores(): any[] {
        return Array.from(this.jugadores.values()).map(j => ({
            nickname: j.nickname, socketID: j.socketID, puntaje: j.puntaje, celdasSeleccionadas: j.celdasSeleccionadas
        }));
    }

    public obtenerInformacion(): any {
        const tiempoTranscurridoMs = Date.now() - this.fechaCreacion.getTime();
        const tiempoLimiteMs = this.config.TIEMPO_VIDA_PARTIDA_MIN * 60 * 1000;
        return {
            id: this.idPartida, tipo: this.tipoJuego, tematica: this.tematica,
            jugadoresActuales: this.jugadores.size, jugadoresMaximos: this.numJugadoresMax,
            tiempoRestanteSegundos: Math.floor(Math.max(0, tiempoLimiteMs - tiempoTranscurridoMs) / 1000),
            jugadoresNombres: Array.from(this.jugadores.keys()), duracionMinutos: this.duracionMinutos
        };
    }
    public getNumJugadoresMax(): number { return this.numJugadoresMax; }
    public getEstado(): any { return this.estado; }
    public getConfiguracion(): Configuracion { return this.config; }
}