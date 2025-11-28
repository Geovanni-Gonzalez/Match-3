import { Configuracion } from '../interfaces';
import { Jugador } from './Jugador';
import { Tablero } from './Tablero';
import { WorkerThreadUtility } from '../worker/workerUtility';

export class Partida {
    public estado: 'espera' | 'jugando' | 'finalizada' = 'espera';
    public jugadores: Map<string, Jugador> = new Map(); // La clave DEBE ser el socketID
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
        this.jugadores.set(jugador.socketID, jugador);
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
    public async procesarMatch(socketID: string): Promise<void> {
        const jugador = this.jugadores.get(socketID);
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
        });

        this.enviarEstadoATodos(); // Notificar resultados finales
    }

    public enviarEstadoATodos(): void {
        // Lógica real: io.to(this.idPartida).emit('estado_partida_actualizado', ...);
        console.log(`[SOCKET.IO] Enviando estado actualizado a la sala ${this.idPartida}.`);
    }
    // server/src/classes/Partida.ts

// ... (métodos existentes)

/**
 * REQ-024: Maneja la selección/deselección de una celda por parte de un jugador.
 * @param socketID El ID del socket del jugador que realiza la acción.
 * @param r Fila de la celda.
 * @param c Columna de la celda.
 */
public manejarSeleccionCelda(socketID: string, r: number, c: number): void {
    const jugador = Array.from(this.jugadores.values()).find(j => j.socketID === socketID);
    const celda = this.tablero.obtenerCelda(r, c);

    if (this.estado !== 'jugando' || !jugador || !celda) {
        console.warn(`[Partida ${this.idPartida}] Acción de selección ignorada.`);
        return; // No se permite seleccionar si el juego no está activo o si los datos son inválidos.
    }

    const { celdasSeleccionadas } = jugador;
    const estaSeleccionada = celdasSeleccionadas.some(coord => coord.r === r && coord.c === c);
    
    // --- Lógica de Selección/Deselección ---
    
    if (estaSeleccionada) {
        // Deseleccionar: El método del Jugador ya maneja el 'splice' (toggle).
        jugador.agregarCelda(r, c); 
        celda.establecerEstado('libre');
        
    } else if (celdasSeleccionadas.length < this.config.MATCH_FINITO_LIMITE) {
        // Solo agregar si hay límite y aún no se alcanza
        
        // 1. Lógica de Adyacencia (Opcional REQ-024, pero recomendado para Match-3 secuencial)
        if (celdasSeleccionadas.length > 0) {
            const ultimaCelda = celdasSeleccionadas[celdasSeleccionadas.length - 1];
            if (!this.esAdyacente(r, c, ultimaCelda.r, ultimaCelda.c)) {
                // Si la nueva celda no es adyacente a la última, no la agregamos.
                // Opcionalmente, se podría lanzar un error para notificar al cliente.
                console.warn('Selección rechazada: La celda no es adyacente a la última seleccionada.');
                return;
            }
        }
        
        // 2. Agregar y marcar el estado
        jugador.agregarCelda(r, c);
        celda.establecerEstado('seleccion_propia'); // Marca la celda como seleccionada por este jugador

    } else {
        // Límite de selección alcanzado, notificar al jugador o forzar el match.
        console.warn(`[Partida ${this.idPartida}] Límite de selección alcanzado por ${jugador.nickname}.`);
        return;
    }

    // Si se seleccionaron al menos 3 celdas, el cliente puede activar el match.
    // También se puede forzar el match automáticamente aquí si se alcanza un número (e.g., 3)
    if (jugador.celdasSeleccionadas.length >= 3) {
        // El cliente debe emitir 'activar_match' o lo forzamos aquí.
        // this.procesarMatch(jugador.nickname);
    }
    
    this.enviarEstadoATodos();
}

/**
 * Helper para validar si dos coordenadas son adyacentes (horizontal o vertical).
 */
private esAdyacente(r1: number, c1: number, r2: number, c2: number): boolean {
    const dr = Math.abs(r1 - r2);
    const dc = Math.abs(c1 - c2);
    // Adyacente si la diferencia de una coordenada es 1 y la otra es 0 (horizontal o vertical)
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1); 
}


}

