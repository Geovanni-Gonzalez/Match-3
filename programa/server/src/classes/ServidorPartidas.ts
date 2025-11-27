// server/src/classes/ServidorPartidas.ts

import { Configuracion } from '../interfaces';
import { Partida } from './Partida';
import { Jugador } from './Jugador'; // Se usa al unirse a la partida
import * as fs from 'fs';
import * as path from 'path';

// MOCK: Simulación de carga del archivo config.json
const MOCK_CONFIG: Configuracion = {
    TIEMPO_VIDA_PARTIDA_MIN: 3,
    MATCH_FINITO_LIMITE: 100,
    TAMANIO_FILA: 9,
    TAMANIO_COLUMNA: 7,
    COLORES_VALIDOS: ["azul", "naranja", "rojo", "verde", "amarillo", "morado"],
    TIEMPO_MATCH_ACTIVATE_MS: 2000,
};

/**
 * Clase Singleton que gestiona todas las partidas del servidor
 * REQ-007, REQ-009, REQ-010, REQ-011
 */
export class ServidorPartidas {
    private static instance: ServidorPartidas;
    public partidasActivas: Map<string, Partida> = new Map();
    private config: Configuracion;
    
    private constructor(config: Configuracion) {
        this.config = config;
        console.log('[ServidorPartidas] Instancia única creada');
        console.log('[ServidorPartidas] Configuración cargada:', JSON.stringify(config, null, 2));
    }

    /**
     * Obtiene la instancia única del servidor (Singleton Pattern)
     */
    public static getInstance(): ServidorPartidas {
        if (!ServidorPartidas.instance) {
            const config = ServidorPartidas.cargarConfiguracion();
            ServidorPartidas.instance = new ServidorPartidas(config); 
        }
        return ServidorPartidas.instance;
    }

    /**
     * Carga la configuración desde el archivo config.json
     * Si no se encuentra, usa el MOCK_CONFIG como respaldo
     */
    private static cargarConfiguracion(): Configuracion {
        try {
            const configPath = path.join(__dirname, '../../../config.json');
            const configData = fs.readFileSync(configPath, 'utf-8');
            const config: Configuracion = JSON.parse(configData);
            console.log('[ServidorPartidas] ✓ Configuración cargada desde config.json');
            return config;
        } catch (error) {
            console.warn('[ServidorPartidas] ⚠️ No se pudo cargar config.json, usando MOCK_CONFIG');
            return MOCK_CONFIG;
        }
    }

    /**
     * Crea una nueva partida con los parámetros especificados
     * REQ-007: Crear partida con modo de juego
     * REQ-008: Seleccionar temática, duración y cantidad de jugadores
     * REQ-009: Generar código identificador único
     * REQ-010: Cancelar partida si no inicia en tiempo configurado
     * 
     * @param nickname - Nombre del usuario creador (REQ-005)
     * @param tipo - Tipo de juego: 'Match' o 'Tiempo'
     * @param tematica - Temática del juego (estándar requerido)
     * @param numJugadoresMax - Cantidad de jugadores (mínimo 2)
     * @param duracionMinutos - Duración opcional de la partida (solo para tipo 'Tiempo')
     * @returns Partida creada
     */
    public crearPartida(
        nickname: string,
        tipo: 'Match' | 'Tiempo', 
        tematica: string, 
        numJugadoresMax: number,
        duracionMinutos?: number
    ): Partida {
        console.log('\n========== CREAR PARTIDA ==========');
        console.log(`[ServidorPartidas] Solicitud de creación de partida:`);
        console.log(`  - Creador: ${nickname}`);
        console.log(`  - Tipo: ${tipo}`);
        console.log(`  - Temática: ${tematica}`);
        console.log(`  - Jugadores máximos: ${numJugadoresMax}`);
        console.log(`  - Duración: ${duracionMinutos ? duracionMinutos + ' minutos' : 'N/A'}`);
        
        // Validar parámetros (REQ-008)
        this.validarParametrosPartida(tipo, tematica, numJugadoresMax, duracionMinutos);
        
        // Generar código único (REQ-009)
        const idPartida = this.generarCodigoUnico();
        console.log(`[ServidorPartidas] Código generado: ${idPartida}`);
        
        // Crear la partida
        const nuevaPartida = new Partida(
            idPartida, 
            tipo, 
            tematica, 
            numJugadoresMax, 
            this.config,
            duracionMinutos
        );
        
        // Registrar partida en el servidor
        this.partidasActivas.set(idPartida, nuevaPartida);
        console.log(`[ServidorPartidas] Partida registrada. Total activas: ${this.partidasActivas.size}`);
        
        // Configurar temporizador de cancelación automática (REQ-010)
        this.configurarTemporizadorCancelacion(idPartida);
        
        console.log(`[ServidorPartidas] ✓ Partida creada exitosamente`);
        console.log('===================================\n');
        
        return nuevaPartida;
    }

    /**
     * Valida los parámetros de creación de partida
     * REQ-008: Validar temática, duración y cantidad de jugadores
     */
    private validarParametrosPartida(
        tipo: string, 
        tematica: string, 
        numJugadores: number,
        duracion?: number
    ): void {
        console.log('[ServidorPartidas] Validando parámetros...');
        
        // Validar tipo de juego
        if (tipo !== 'Match' && tipo !== 'Tiempo') {
            throw new Error('Tipo de juego inválido. Debe ser "Match" o "Tiempo"');
        }
        
        // Validar temática (mínimo debe ser estándar)
        if (!tematica || tematica.trim().length === 0) {
            throw new Error('La temática es requerida');
        }
        
        // Validar cantidad de jugadores (mínimo 2)
        if (numJugadores < 2) {
            throw new Error('La partida debe tener mínimo 2 jugadores');
        }
        
        if (numJugadores > 8) {
            throw new Error('La partida no puede tener más de 8 jugadores');
        }
        
        // Validar duración si es tipo Tiempo
        if (tipo === 'Tiempo' && duracion && duracion <= 0) {
            throw new Error('La duración debe ser mayor a 0 minutos');
        }
        
        console.log('[ServidorPartidas] ✓ Parámetros válidos');
    }

    /**
     * Genera un código único de 5-6 caracteres para identificar la partida
     * REQ-009: Generar código identificador único
     */
    private generarCodigoUnico(): string {
        let codigo: string;
        let intentos = 0;
        const maxIntentos = 100;
        
        do {
            // Generar código alfanumérico de 5-6 caracteres
            codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
            intentos++;
            
            if (intentos >= maxIntentos) {
                throw new Error('No se pudo generar un código único después de múltiples intentos');
            }
        } while (this.partidasActivas.has(codigo));
        
        return codigo;
    }

    /**
     * Configura el temporizador de cancelación automática de la partida
     * REQ-010: Cancelar partida si no inicia en tiempo configurado
     */
    private configurarTemporizadorCancelacion(idPartida: string): void {
        const tiempoEsperaMs = this.config.TIEMPO_VIDA_PARTIDA_MIN * 60 * 1000;
        console.log(`[ServidorPartidas] Temporizador de cancelación configurado: ${this.config.TIEMPO_VIDA_PARTIDA_MIN} minutos`);
        
        setTimeout(() => {
            this.verificarYCancelarPartida(idPartida);
        }, tiempoEsperaMs);
    }

    /**
     * Verifica y cancela la partida si no ha iniciado
     * REQ-010: Cancelar partida si no es iniciada en tiempo configurado
     */
    private verificarYCancelarPartida(idPartida: string): void {
        const partida = this.partidasActivas.get(idPartida);
        
        if (!partida) {
            return; // Ya fue eliminada o finalizada
        }
        
        if (partida.estado === 'espera') {
            console.log('\n========== CANCELACIÓN AUTOMÁTICA ==========');
            console.log(`[ServidorPartidas] Partida ${idPartida} no iniciada en tiempo límite`);
            console.log(`[ServidorPartidas] Estado: ${partida.estado}`);
            console.log(`[ServidorPartidas] Jugadores unidos: ${partida.jugadores.size}/${partida.getNumJugadoresMax()}`);
            
            // Eliminar la partida
            this.partidasActivas.delete(idPartida);
            console.log(`[ServidorPartidas] ✓ Partida cancelada y eliminada`);
            console.log(`[ServidorPartidas] Partidas activas restantes: ${this.partidasActivas.size}`);
            console.log('============================================\n');
            
            // TODO: Notificar a los jugadores conectados via Socket.IO
            // io.to(idPartida).emit('partida_cancelada', { mensaje: 'Partida cancelada por tiempo de espera' });
        }
    }

    /**
     * Permite a un jugador unirse a una partida existente
     * REQ-005: Usuario debe autenticarse con nickname
     * REQ-012: Usuarios en espera de completar número de jugadores
     * 
     * @param codigo - Código de la partida
     * @param nickname - Nombre del jugador
     * @param socketID - ID del socket para comunicación en tiempo real
     * @returns Jugador creado y agregado a la partida
     */
    public unirseAPartida(codigo: string, nickname: string, socketID: string): Jugador {
        console.log('\n========== UNIRSE A PARTIDA ==========');
        console.log(`[ServidorPartidas] Solicitud de unión:`);
        console.log(`  - Código: ${codigo}`);
        console.log(`  - Nickname: ${nickname}`);
        console.log(`  - Socket ID: ${socketID}`);
        
        // Validar que la partida exista
        const partida = this.partidasActivas.get(codigo);
        if (!partida) {
            console.log(`[ServidorPartidas] ✗ Error: Partida no encontrada`);
            throw new Error('Partida no encontrada o ya finalizada.');
        }

        console.log(`[ServidorPartidas] Partida encontrada. Estado: ${partida.estado}`);
        console.log(`[ServidorPartidas] Jugadores actuales: ${partida.jugadores.size}/${partida.getNumJugadoresMax()}`);

        // Simular obtención de ID de BD (en producción vendría de la autenticación)
        const jugadorDBId = Math.floor(Math.random() * 1000) + 1; 
        const nuevoJugador = new Jugador(nickname, jugadorDBId, socketID);

        // Agregar jugador a la partida (REQ-012)
        partida.agregarJugador(nuevoJugador);
        
        console.log(`[ServidorPartidas] ✓ Jugador ${nickname} unido exitosamente`);
        console.log(`[ServidorPartidas] Jugadores ahora: ${partida.jugadores.size}/${partida.getNumJugadoresMax()}`);
        console.log('======================================\n');
        
        // TODO: Lógica de Socket.IO: socket.join(codigo);
        return nuevoJugador;
    }

    /**
     * Obtiene la lista de partidas disponibles para unirse
     * REQ-011: Mostrar lista de partidas por iniciar con información completa
     * 
     * @returns Array de información de partidas en estado 'espera'
     */
    public obtenerPartidasDisponibles(): Array<{
        id: string;
        tipo: string;
        tematica: string;
        jugadoresActuales: number;
        jugadoresMaximos: number;
        tiempoRestanteSegundos: number;
        jugadoresNombres: string[];
    }> {
        console.log('\n========== LISTAR PARTIDAS ==========');
        console.log(`[ServidorPartidas] Total de partidas activas: ${this.partidasActivas.size}`);
        
        const partidasDisponibles = Array.from(this.partidasActivas.values())
            .filter(p => p.estado === 'espera')
            .map(p => {
                const info = p.obtenerInformacion();
                console.log(`  - ${info.id}: ${info.tipo} | ${info.tematica} | ${info.jugadoresActuales}/${info.jugadoresMaximos} jugadores`);
                return info;
            });
        
        console.log(`[ServidorPartidas] Partidas disponibles: ${partidasDisponibles.length}`);
        console.log('=====================================\n');
        
        return partidasDisponibles;
    }
    
    /**
     * Maneja la conexión de un nuevo socket
     * @param socketID - ID del socket conectado
     */
    public manejarConexionSocket(socketID: string): void {
        console.log(`[ServidorPartidas] Nueva conexión Socket: ${socketID}`);
    }

    /**
     * Obtiene la configuración actual del servidor
     */
    public getConfiguracion(): Configuracion {
        return this.config;
    }

    /**
     * Obtiene el número total de partidas activas
     */
    public getTotalPartidasActivas(): number {
        return this.partidasActivas.size;
    }
}