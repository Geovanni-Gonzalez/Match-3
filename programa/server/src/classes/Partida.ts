import { Configuracion, Coordenada } from '../interfaces';
import { Jugador } from './Jugador';
import { Tablero } from './Tablero';
import { WorkerThreadUtility } from '../worker/workerUtility';

//-----------------------------------------
// Clase que representa una partida del juego
//-----------------------------------------
export class Partida {
    public estado: 'espera' | 'jugando' | 'finalizada' = 'espera';
    public jugadores: Map<string, Jugador> = new Map();
    public tablero: Tablero;
    public cronometro: ReturnType<typeof setInterval> | null = null;
    private config: Configuracion;
    private fechaCreacion: Date;
    public duracionMinutos?: number;

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
        
        // Validar que haya campo en la partida
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

    
    //Inicia el juego cuando se completa el número de jugadores
    //REQ-012: La partida solo cambia de estado cuando la cantidad de 
    //                      usuarios unidos es igual a la configurada
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

    
    //Configura el cronometro para partidas de tipo Tiempo
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
     * seleccionarCelda - Jugador toca una celda para seleccionar su grupo
     * Detecta el grupo completo de 3+ celdas del mismo color y las bloquea para ese jugador
     * @param nickname - Jugador que selecciona
     * @param r - Fila de la celda tocada
     * @param c - Columna de la celda tocada
     * @returns { exito, mensaje, grupo } - Resultado de la operación
     */
    public seleccionarCelda(nickname: string, r: number, c: number): { 
        exito: boolean; 
        mensaje: string; 
        grupo?: Coordenada[] 
    } {
        const jugador = this.jugadores.get(nickname);
        if (!jugador) {
            return { exito: false, mensaje: 'Jugador no encontrado' };
        }

        const celda = this.tablero.obtenerCelda(r, c);
        if (!celda) {
            return { exito: false, mensaje: 'Celda fuera de límites' };
        }

        // Verificar si la celda ya está bloqueada por otro jugador
        if (celda.estaBloqueada() && celda.bloqueadaPor !== nickname) {
            return { exito: false, mensaje: `Celda bloqueada por ${celda.bloqueadaPor}` };
        }

        // Si el jugador ya tiene este grupo seleccionado, cancelar selección
        if (celda.bloqueadaPor === nickname) {
            return this.cancelarSeleccion(nickname);
        }

        // Detectar el grupo completo desde esta celda
        const grupo = this.tablero.detectarGrupoDesde(r, c);

        if (grupo.length < 3) {
            return { exito: false, mensaje: 'No hay grupo válido (se necesitan 3+ celdas)' };
        }

        // Verificar que ninguna celda del grupo esté bloqueada por otro jugador
        for (const coord of grupo) {
            const celdaGrupo = this.tablero.obtenerCelda(coord.r, coord.c);
            if (celdaGrupo && celdaGrupo.estaBloqueada() && celdaGrupo.bloqueadaPor !== nickname) {
                return { exito: false, mensaje: `Grupo parcialmente bloqueado por ${celdaGrupo.bloqueadaPor}` };
            }
        }

        // Limpiar selección anterior si existe
        this.limpiarSeleccionJugador(nickname);

        // Bloquear todas las celdas del grupo para este jugador
        grupo.forEach(coord => {
            const celdaGrupo = this.tablero.obtenerCelda(coord.r, coord.c);
            if (celdaGrupo) {
                celdaGrupo.bloquearPara(nickname);
                celdaGrupo.establecerEstado('seleccion_propia');
            }
        });

        // Guardar grupo en el jugador
        jugador.celdasSeleccionadas = grupo;

        console.log(`[Partida ${this.idPartida}] ${nickname} seleccionó grupo de ${grupo.length} celdas (${celda.colorID})`);

        return { 
            exito: true, 
            mensaje: `Grupo de ${grupo.length} celdas seleccionado`, 
            grupo 
        };
    }

    /**
     * cancelarSeleccion - Cancela la selección actual de un jugador
     */
    public cancelarSeleccion(nickname: string): { exito: boolean; mensaje: string } {
        this.limpiarSeleccionJugador(nickname);
        console.log(`[Partida ${this.idPartida}] ${nickname} canceló su selección`);
        return { exito: true, mensaje: 'Selección cancelada' };
    }

    /**
     * limpiarSeleccionJugador - Desbloquea las celdas seleccionadas por un jugador
     */
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

    /**
     * limpiarTodasLasSelecciones - Desbloquea TODAS las selecciones de TODOS los jugadores
     * Se usa cuando alguien hace match para evitar conflictos
     */
    private limpiarTodasLasSelecciones(): void {
        console.log(`[Partida ${this.idPartida}] Limpiando TODAS las selecciones...`);
        
        // Limpiar selecciones de cada jugador
        this.jugadores.forEach((jugador, nickname) => {
            if (jugador.celdasSeleccionadas.length > 0) {
                console.log(`[Partida ${this.idPartida}] - Liberando ${jugador.celdasSeleccionadas.length} celdas de ${nickname}`);
                this.limpiarSeleccionJugador(nickname);
            }
        });
        
        console.log(`[Partida ${this.idPartida}] ✓ Todas las selecciones liberadas`);
    }

    /**
     * limpiarSeleccionesAfectadas - Limpia selecciones de otros jugadores que incluyan celdas eliminadas
     * @param celdasEliminadas - Coordenadas de las celdas que fueron eliminadas en el match
     * @param nicknameQueHizoMatch - Jugador que hizo el match (se salta)
     */
    private limpiarSeleccionesAfectadas(celdasEliminadas: Coordenada[], nicknameQueHizoMatch: string): void {
        console.log(`[Partida ${this.idPartida}] Verificando selecciones afectadas por el match...`);
        
        // Crear Set de celdas eliminadas para búsqueda rápida
        const celdasEliminadasSet = new Set(
            celdasEliminadas.map(c => `${c.r},${c.c}`)
        );

        // Revisar cada jugador (excepto el que hizo match)
        this.jugadores.forEach((jugador, nickname) => {
            if (nickname === nicknameQueHizoMatch) return;
            
            if (jugador.celdasSeleccionadas.length > 0) {
                // Verificar si alguna celda seleccionada fue eliminada
                const tieneAfectadas = jugador.celdasSeleccionadas.some(coord => 
                    celdasEliminadasSet.has(`${coord.r},${coord.c}`)
                );

                if (tieneAfectadas) {
                    console.log(`[Partida ${this.idPartida}] - ${nickname} tenía celdas afectadas, limpiando su selección`);
                    this.limpiarSeleccionJugador(nickname);
                }
            }
        });
        
        console.log(`[Partida ${this.idPartida}] ✓ Selecciones afectadas limpiadas`);
    }

    /**
     * confirmarMatch - Procesa el match seleccionado por un jugador
     * Calcula puntos, elimina celdas, aplica gravedad y rellena
     * @param nickname - Jugador que confirma su match
     */
    public confirmarMatch(nickname: string): { exito: boolean; mensaje: string; puntos?: number } {
        const jugador = this.jugadores.get(nickname);
        
        if (!jugador) {
            return { exito: false, mensaje: 'Jugador no encontrado' };
        }

        if (jugador.celdasSeleccionadas.length < 3) {
            return { exito: false, mensaje: 'No hay grupo seleccionado' };
        }

        console.log(`\n[Partida ${this.idPartida}] ========== ${nickname.toUpperCase()} CONFIRMA MATCH ==========`);
        console.log(`[Partida ${this.idPartida}] Celdas: ${jugador.celdasSeleccionadas.length}`);

        try {
            const n = jugador.celdasSeleccionadas.length;

            // 1. Calcular y asignar puntos (n²)
            jugador.calcularPuntaje(n);

            // 2. Guardar celdas eliminadas para limpiar selecciones afectadas
            const celdasEliminadas = [...jugador.celdasSeleccionadas];

            // 3. Eliminar celdas y rellenar
            this.tablero.procesarMatchesEnCascada(jugador.celdasSeleccionadas);

            // 4. Limpiar solo la selección del jugador que hizo match
            this.limpiarSeleccionJugador(nickname);

            // 5. Limpiar selecciones de otros jugadores SOLO si sus celdas fueron afectadas
            this.limpiarSeleccionesAfectadas(celdasEliminadas, nickname);

            // 6. Mostrar tabla de posiciones
            this.mostrarTablaPosiciones();

            // 7. Notificar a todos
            this.enviarEstadoATodos();

            console.log(`[Partida ${this.idPartida}] ========================================\n`);

            return { 
                exito: true, 
                mensaje: `Match confirmado: +${Math.pow(n, 2)} puntos`, 
                puntos: Math.pow(n, 2) 
            };

        } catch (error) {
            console.error(`[Partida ${this.idPartida}] ✗ Error al confirmar match:`, error);
            return { exito: false, mensaje: 'Error al procesar match' };
        }
    }

    /**
     * limpiarEstadosCeldas - Resetea el estado de todas las celdas a 'libre' y desbloquea
     */
    private limpiarEstadosCeldas(): void {
        this.tablero.matriz.forEach(fila => 
            fila.forEach(celda => {
                celda.establecerEstado('libre');
                celda.desbloquear();
            })
        );
    }

    /**
     * mostrarTablaPosiciones - Imprime en consola el ranking actual de jugadores en consola
     */
    private mostrarTablaPosiciones(): void {
        console.log(`\n[Partida ${this.idPartida}] Tabla de posiciones:`);
        const ranking = Array.from(this.jugadores.values())
            .sort((a, b) => b.puntaje - a.puntaje);
        
        ranking.forEach((jugador, index) => {
            const medalla = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
            console.log(`[Partida ${this.idPartida}]   ${medalla} ${index + 1}. ${jugador.nickname}: ${jugador.puntaje} puntos`);
        });
        console.log('');
    }

    //Finaliza el juego y calcula resultados
    //REQ-030: Determina posiciones
    //REQ-031, REQ-032: Persistencia de estadisticas
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
        console.log(`[Partida ${this.idPartida}] Ganador: ${ganador.nickname}`);
        
        // Persistencia de Estadísticas (REQ-031, REQ-032)
        this.jugadores.forEach(jugador => {
            const esGanador = (ganador.puntaje > 0) && (jugador.puntaje === ganador.puntaje);
            jugador.guardarEstadisticas(this.idPartida, esGanador);
        });

        console.log(`[Partida ${this.idPartida}] Partida finalizada`);
        console.log('===========================================\n');

        this.enviarEstadoATodos(); // Notificar resultados finales
    }


    //Envía el estado actualizado a todos los jugadores
    public enviarEstadoATodos(): void {
        // Lógica real: io.to(this.idPartida).emit('estado_partida_actualizado', ...);
        console.log(`[Partida ${this.idPartida}] Estado enviado a todos los jugadores`);
    }

    //Obtiene información completa de la partida
    //REQ-011: Información completa de partidas disponibles
    public obtenerInformacion(): {
        id: string;
        tipo: string;
        tematica: string;
        jugadoresActuales: number;
        jugadoresMaximos: number;
        tiempoRestanteSegundos: number;
        jugadoresNombres: string[];
        duracionMinutos?: number;
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
            jugadoresNombres: Array.from(this.jugadores.keys()),
            duracionMinutos: this.duracionMinutos
        };
    }

    //Obtiene el numero maximo de jugadores
    public getNumJugadoresMax(): number {
        return this.numJugadoresMax;
    }

    //Obtiene el estado actual de la partida
    public getEstado(): 'espera' | 'jugando' | 'finalizada' {
        return this.estado;
    }

    //Obtiene la configuracion de la partida
    public getConfiguracion(): Configuracion {
        return this.config;
    }

    /**
     * obtenerEstadoTablero - Retorna la matriz del tablero para enviar al cliente
     */
    public obtenerEstadoTablero(): any {
        return this.tablero.matriz.map(fila => 
            fila.map(celda => ({
                fila: celda.fila,
                columna: celda.columna,
                colorID: celda.colorID,
                estado: celda.estado,
                bloqueadaPor: celda.bloqueadaPor
            }))
        );
    }

    /**
     * obtenerJugadores - Retorna información de todos los jugadores
     */
    public obtenerJugadores(): any[] {
        return Array.from(this.jugadores.values()).map(jugador => ({
            nickname: jugador.nickname,
            socketID: jugador.socketID,
            puntaje: jugador.puntaje,
            celdasSeleccionadas: jugador.celdasSeleccionadas
        }));
    }
}