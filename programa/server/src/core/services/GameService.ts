/**
 * @file GameService.ts
 * @description Servicio principal que orquesta la lógica de negocio del juego.
 * 
 * Responsabilidades:
 * - Gestión del ciclo de vida de las partidas (creación, inicio, finalización).
 * - Coordinación de jugadores (unión, desconexión, reconexión).
 * - Manejo de eventos de juego (selección de celdas, validación de matches).
 * - Persistencia de datos a través de repositorios.
 * - Comunicación en tiempo real con los clientes vía Socket.IO.
 */

import { Server } from 'socket.io';
import { ServidorPartidas } from '../manager/ServidorPartidas.js';
import { Jugador } from '../domain/Jugador.js';
import { MatchService } from './MatchService.js';
import config from '../../config/config.js';
import { Coordenada } from '../../interfaces.js';
import { PlayerRepo } from '../repositories/PlayerRepo.js';
import { PartidaRepo } from '../repositories/PartidaRepo.js';
import { TimerManager } from '../manager/TimerManager.js';

export class GameService {
  private servidor = ServidorPartidas.getInstance();

  /**
   * Inicializa el servicio de juego.
   * @param io - Instancia del servidor Socket.IO para comunicación en tiempo real.
   */
  constructor(private io: Server) {
    TimerManager.getInstance().setSocketServer(io);
  }

  /**
   * Maneja la expiración del tiempo de espera de una partida en el lobby.
   * 
   * Lógica:
   * - Si hay suficientes jugadores (>=2), inicia la partida automáticamente.
   * - Si no hay suficientes jugadores, elimina la partida y notifica.
   * 
   * @param matchId - ID único de la partida.
   */
  async handleMatchExpiration(matchId: string) {
    try {
      const match = this.servidor.obtenerPartida(matchId);
      if (!match) return;

      // Si la partida ya inició o finalizó, no hacer nada
      if (match.estado !== 'espera') return;

      const players = this.servidor.obtenerPartida(matchId)?.getJugadores() || [];

      if (players.length >= 2) {
        // Si hay suficientes jugadores, iniciar la partida automáticamente
        console.log(`[GameService] Tiempo de espera agotado para partida ${matchId}. Iniciando con ${players.length} jugadores.`);
        
        // 1. Preparar la partida (cambia estado a 'ready_to_start' y notifica clientes)
        // Pasamos undefined como socketID para indicar que es una acción del sistema
        this.prepararPartida(matchId);
        
        // 2. Iniciar la cuenta regresiva
        this.iniciarPartida(matchId);
      } else {
        // Si no hay suficientes jugadores, eliminar la partida
        console.log(`[GameService] Tiempo de espera agotado para partida ${matchId}. Eliminando por falta de jugadores.`);
        this.eliminarPartida(matchId);
        // Notificar a los clientes (opcional, pero buena práctica)
        this.io.to(matchId).emit('partida:deleted_due_timeout', { partidaId: matchId });
      }
    } catch (error) {
      console.error(`[GameService] Error en handleMatchExpiration para ${matchId}:`, error);
    }
  }

  /**
   * Crea una nueva partida, la almacena en memoria y la persiste en la base de datos.
   * Configura el temporizador de vida útil de la partida en el lobby.
   * 
   * @param idPartida - Código único de la partida.
   * @param tipoJuego - Tipo de juego ('Match' o 'Tiempo').
   * @param tematica - Temática visual del juego.
   * @param max - Número máximo de jugadores permitidos.
   * @param duracion - Duración en minutos (opcional, solo para modo 'Tiempo').
   * @returns La instancia de la partida creada.
   */
  public async crearPartida(idPartida: string, tipoJuego: 'Match' | 'Tiempo', tematica: string, max: number, duracion?: number) {
    console.log('[GameService] Creando partida:', idPartida, tipoJuego, tematica, max, duracion);

    // Crear en memoria
    const partida = this.servidor.crearPartida(idPartida, tipoJuego, tematica, max, duracion);

    // Persistir en base de datos
    try {
      await PartidaRepo.crearPartida(idPartida, tipoJuego, tematica, max);
      console.log('[GameService] Partida persistida en BD:', idPartida);
    } catch (err) {
      console.warn('[GameService] Warning: no se pudo persistir partida en BD:', err);
    }

    // Configurar timer de expiración
    TimerManager.getInstance().startTimer(idPartida, config.TIEMPO_VIDA_PARTIDA_MIN * 60, () =>
      this.handleMatchExpiration(idPartida)
    , 'lobby');

    this.emitirListaPartidas(); // Notificar al lobby

    return partida;
  }

  /**
   * Obtiene una partida por su ID.
   * @param idPartida - ID de la partida.
   * @returns La instancia de la partida o undefined si no existe.
   */
  public obtenerPartida(idPartida: string) {
    return this.servidor.obtenerPartida(idPartida);
  }

  /**
   * Permite a un jugador unirse a una partida existente.
   * Crea la instancia del jugador en memoria y persiste la relación en la BD.
   * 
   * @param idPartida - ID de la partida.
   * @param nickname - Nombre del jugador.
   * @param socketID - ID del socket de conexión actual.
   * @param jugadorDBId - ID del jugador en la base de datos.
   * @returns La instancia del nuevo jugador creado.
   * @throws Error si la partida no existe.
   */
  public async unirseAPartida(idPartida: string, nickname: string, socketID: string, jugadorDBId: number) {
    const partida = this.servidor.obtenerPartida(idPartida);
    if (!partida) throw new Error('Partida no encontrada');

    const nuevoJugador = new Jugador(nickname, jugadorDBId, socketID);
    partida.agregarJugador(nuevoJugador);

    // Persistir relación partida <-> jugador (si se puede)
    try {
      await PartidaRepo.agregarJugadorAPartida(idPartida, jugadorDBId);
    } catch (err) {
      // No detener el flujo por error DB, pero loguear
      console.warn('[GameService] Warning: no se pudo persistir unión a partida:', err);
    }

    this.emitirListaPartidas(); // Actualizar contador de jugadores en lobby

    return nuevoJugador;
  }

  /**
   * Elimina una partida de la memoria del servidor y limpia sus timers asociados.
   * @param idPartida - ID de la partida a eliminar.
   */
  public eliminarPartida(idPartida: string) {
    TimerManager.getInstance().clearTimer(idPartida);
    this.servidor.eliminarPartida(idPartida);
    this.emitirListaPartidas(); // Notificar eliminación
  }

  /**
   * Actualiza el estado de "listo" de un jugador en la sala de espera.
   * Si todos los jugadores están listos (y hay al menos 2), emite el evento 'all_players_ready'.
   * 
   * @param partidaId - ID de la partida.
   * @param socketID - ID del socket del jugador.
   * @param isReady - Nuevo estado de listo (true/false).
   */
  public setReady(partidaId: string, socketID: string, isReady: boolean) {
    const partida = this.servidor.obtenerPartida(partidaId);
    if (!partida) return;
    const jugador = partida.obtenerJugador(socketID);
    if (!jugador) return;
    jugador.isReady = isReady;

    this.io.to(partidaId).emit('player_status_changed', { socketID, isReady });

    const jugadoresArr = Array.from(partida.jugadores.values()) as Jugador[];
    const todosReady = jugadoresArr.length >= 2 && jugadoresArr.every((j: Jugador) => j.isReady);
    if (todosReady) {
      this.io.to(partidaId).emit('all_players_ready', { partidaId });
    }
  }

  /**
   * Prepara la partida para ser mostrada en el cliente, cambiando su estado a 'ready_to_start'.
   * Envía el tablero inicial a los clientes para renderizado previo al inicio.
   * 
   * @param partidaId - ID de la partida.
   * @param requestedBySocketID - (Opcional) Socket ID de quien solicita la acción (para validación de host).
   * @throws Error si la partida no existe, no está en espera, o si el solicitante no es el host.
   */
  public prepararPartida(partidaId: string, requestedBySocketID?: string) {
    const partida = this.servidor.obtenerPartida(partidaId);
    if (!partida) throw new Error('Partida no encontrada');
    if (partida.estado !== 'espera') throw new Error('La partida no está en espera para ser preparada.');

    // Verificar que quien solicita sea el host (si se provee socketID)
    if (requestedBySocketID && partida.hostSocketID !== requestedBySocketID) {
      throw new Error('Solo el anfitrión puede preparar la partida.');
    }

    partida.setEstado('ready_to_start');
    const tableroSerializado = partida.tablero.matriz.map((row: any[]) => row.map((c: any) => ({ colorID: c.colorID, estado: c.estado })));
    const gameConfig = {
      ...config,
      limit: partida.tipoJuego === 'Match' ? config.MATCH_FINITO_LIMITE : (config.TIEMPO_VIDA_PARTIDA_MIN * 60),
      tipoJuego: partida.tipoJuego,
      tematica: partida.tematica
    };

    // Emitir para que los clientes naveguen a la vista de juego y carguen el tablero
    this.io.to(partidaId).emit('force_navigate_game', { tablero: tableroSerializado, config: gameConfig });
    this.io.to(partidaId).emit('players_update', partida.getJugadoresResumen());

    this.emitirListaPartidas(); // La partida ya no está en 'espera', actualizar lobby

    console.log(`[GameService] Partida ${partidaId} preparada para iniciar.`);
  }

  /**
   * Inicia la secuencia de arranque de la partida (cuenta regresiva de 3 segundos).
   * 
   * @param partidaId - ID de la partida.
   * @param requestedBySocketID - (Opcional) Socket ID de quien solicita iniciar.
   * @throws Error si la partida no está en estado 'ready_to_start' o si el solicitante no es el host.
   */
  public iniciarPartida(partidaId: string, requestedBySocketID?: string) {
    const partida = this.servidor.obtenerPartida(partidaId);
    if (!partida) throw new Error('Partida no encontrada');
    // Ahora solo se puede iniciar desde el estado 'ready_to_start'
    if (partida.estado !== 'ready_to_start') throw new Error('La partida no está lista para iniciar.');

    // Si se solicita por un socket específico, verificar que sea el host
    if (requestedBySocketID) {
      if (partida.hostSocketID !== requestedBySocketID) {
        throw new Error('Solo el anfitrión puede iniciar la partida');
      }
    }

    // Limpiar timer de lobby para evitar doble inicio (si se inicia manualmente)
    TimerManager.getInstance().clearTimer(partidaId);

    // Iniciar secuencia de cuenta regresiva
    let countdown = 3;
    const countdownInterval = setInterval(() => {
      if (countdown > 0) {
        this.io.to(partidaId).emit('game:countdown', { seconds: countdown });
        countdown--;
      } else {
        clearInterval(countdownInterval);
        this.comenzarJuegoReal(partida);
      }
    }, 1000);
  }

  /**
   * Transición interna al estado 'jugando'.
   * Inicializa timestamps, marca inicio en BD e inicia timers de juego si aplica.
   * 
   * @param partida - Instancia de la partida.
   */
  private comenzarJuegoReal(partida: any) {
    const partidaId = partida.idPartida;
    partida.setEstado('jugando');
    partida.startTime = Date.now();

    // Actualizar fecha_inicio en BD
    PartidaRepo.marcarInicioPartida(partidaId).catch(err => {
      console.warn('[GameService] Error marcando inicio partida en BD:', err);
    });

    // La configuración y el tablero ya deberían haber sido enviados por 'prepararPartida'
    const gameConfig = {
      ...config,
      limit: partida.tipoJuego === 'Match' ? config.MATCH_FINITO_LIMITE : (config.TIEMPO_VIDA_PARTIDA_MIN * 60),
      tipoJuego: partida.tipoJuego,
      tematica: partida.tematica
    };

    // Emitir el inicio real del juego, sin tablero ya que ya se envió
    this.io.to(partidaId).emit('game_started', { config: gameConfig });
    this.io.to(partidaId).emit('players_update', partida.getJugadoresResumen());

    // Iniciar condiciones de fin de juego
    if (partida.tipoJuego === 'Tiempo') {
      // Usar el tiempo configurado o por defecto 3 minutos
      const duracionMinutos = partida.duracionPartida || 3;
      const duracionSegundos = duracionMinutos * 60; 
      TimerManager.getInstance().startTimer(partidaId, duracionSegundos, () => {
        console.log(`[GameService] Tiempo de juego agotado para ${partidaId}`);
        this.finalizarPartida(partidaId);
      }, 'game');
    }
  }

  /**
   * Procesa la selección de una celda por parte de un jugador.
   * Valida turno, estado de celda y bloqueos por otros jugadores.
   * 
   * @param partidaId - ID de la partida.
   * @param socketID - ID del socket del jugador.
   * @param r - Fila seleccionada.
   * @param c - Columna seleccionada.
   */
  public manejarSeleccion(partidaId: string, socketID: string, r: number, c: number) {
    const partida = this.servidor.obtenerPartida(partidaId);
    if (!partida) return;
    if (partida.estado !== 'jugando') return;

    const jugador = partida.obtenerJugador(socketID);
    if (!jugador) return;

    const celda = partida.tablero.obtenerCelda(r, c);
    if (!celda) return;

    // Verificar si la celda está bloqueada por otro jugador
    if (celda.seleccionadoPor && celda.seleccionadoPor !== socketID) {
      this.io.to(socketID).emit('cell_blocked', { r, c, by: celda.seleccionadoPor });
      return;
    }

    const yaSeleccionada = jugador.celdasSeleccionadas.some((s: Coordenada) => s.r === r && s.c === c);
    if (yaSeleccionada) {
      jugador.agregarCelda(r, c);
      celda.establecerEstado('libre');
      celda.seleccionadoPor = null;
    } else {
      if (jugador.celdasSeleccionadas.length >= config.MATCH_FINITO_LIMITE) return;
      jugador.agregarCelda(r, c);
      celda.establecerEstado('seleccion_propia');
      celda.seleccionadoPor = socketID;
    }

    this.emitirEstadoPartida(partidaId);
  }

  /**
   * Intenta validar y ejecutar un match con las celdas seleccionadas por el jugador.
   * 
   * Flujo:
   * 1. Valida que haya al menos 3 celdas seleccionadas.
   * 2. Llama a MatchService para validar la cadena.
   * 3. Si es válido: suma puntos, actualiza tablero, notifica éxito y verifica fin de juego.
   * 4. Si es inválido: limpia selección y notifica error.
   * 
   * @param partidaId - ID de la partida.
   * @param socketID - ID del socket del jugador.
   */
  public async activarMatch(partidaId: string, socketID: string) {
    const partida = this.servidor.obtenerPartida(partidaId);
    if (!partida) return;
    const jugador = partida.obtenerJugador(socketID);
    if (!jugador) return;

    const lista = jugador.celdasSeleccionadas.slice();
    if (lista.length < 3) {
      this.io.to(socketID).emit('match_invalid', { reason: 'Necesitas al menos 3 celdas' });
      return;
    }

    const resultado = await MatchService.validarCadena(lista as Coordenada[], partida.tablero.matriz);
    if (!resultado.valido) {
      jugador.limpiarSelecciones();
      partida.tablero.matriz.forEach((row: any[]) => row.forEach((c: any) => {
        if (c.seleccionadoPor === socketID) {
          c.establecerEstado('libre');
          c.seleccionadoPor = null;
        }
      }));
      this.emitirEstadoPartida(partidaId);
      this.io.to(socketID).emit('match_result', { valido: false });
      return;
    }

    // Válido: actualizar puntaje y tablero
    jugador.calcularPuntaje(resultado.n);
    partida.tablero.actualizarCeldas(resultado.celdas);
    partida.matchesRealizados = (partida.matchesRealizados || 0) + 1;

    jugador.limpiarSelecciones();
    partida.tablero.matriz.forEach((row: any[]) => row.forEach((c: any) => {
      if (c.seleccionadoPor === socketID) {
        c.establecerEstado('libre');
        c.seleccionadoPor = null;
      }
    }));

    this.emitirEstadoPartida(partidaId);
    this.io.to(partidaId).emit('match_result', { valid: true, jugador: jugador.obtenerInfoBasica() });

    // Verificar condición de fin de juego por Matches
    if (partida.tipoJuego === 'Match') {
      const limite = config.MATCH_FINITO_LIMITE || 100;
      const matchesRestantes = Math.max(0, limite - partida.matchesRealizados);
      
      this.io.to(partidaId).emit('game:match_update', { matchesLeft: matchesRestantes });

      if (partida.matchesRealizados >= limite) {
        console.log(`[GameService] Límite de matches alcanzado para ${partidaId}`);
        this.finalizarPartida(partidaId);
      }
    }
  }

  /**
   * Emite el estado actual de la partida (tablero y jugadores) a todos los participantes.
   * @param partidaId - ID de la partida.
   */
  private emitirEstadoPartida(partidaId: string) {
    const partida = this.servidor.obtenerPartida(partidaId);
    if (!partida) return;

    const tableroSerializado = partida.tablero.matriz.map((row: any[]) => row.map((c: any) => ({
      r: c.fila, c: c.columna, colorID: c.colorID, estado: c.estado, seleccionadoPor: c.seleccionadoPor
    })));

    this.io.to(partidaId).emit('players_update', partida.getJugadoresResumen());
    this.io.to(partidaId).emit('board_update', { tablero: tableroSerializado });
  }

  /**
   * Finaliza la partida, calcula ganadores y persiste los resultados en la base de datos.
   * @param partidaId - ID de la partida a finalizar.
   */
  public async finalizarPartida(partidaId: string) {
    const partida = this.servidor.obtenerPartida(partidaId);
    if (!partida) {
      console.warn(`[GameService] finalizarPartida: Partida ${partidaId} no encontrada (posiblemente ya eliminada).`);
      return;
    }
    if (partida.estado === 'finalizada') return;

    partida.setEstado('finalizada');

    const endTime = Date.now();
    const durationSeconds = partida.startTime ? Math.floor((endTime - partida.startTime) / 1000) : 0;

    // Asegurar el tipo correcto para que TypeScript reconozca las propiedades de Jugador
    const resultadosOrdenados = Array.from(partida.jugadores.values()) as Jugador[];
    resultadosOrdenados.sort((a, b) => b.puntaje - a.puntaje);
    const ganador = resultadosOrdenados[0];

    // Preparar resultados para persistir (idDB, puntaje, esGanador)
    const resultadosForDb = resultadosOrdenados.map((j: Jugador) => ({
      idJugador: j.idDB,
      puntaje: j.puntaje,
      esGanador: !!(ganador && ganador.puntaje > 0 && j.puntaje === ganador.puntaje),
      tiempoInvertido: durationSeconds
    }));

    const idGanadorPrincipal = (ganador && ganador.puntaje > 0) ? ganador.idDB : null;

    try {
      await PartidaRepo.guardarResultadosFinales(partidaId, resultadosForDb, idGanadorPrincipal);
    } catch (err) {
      console.warn('[GameService] No se pudo persistir resultados finales:', err);
    }

    // Emitir estado final
    this.io.to(partidaId).emit('game_finished', { resultados: partida.getJugadoresResumen() });

    // Opcional: eliminar partida en memoria (según política)
    // this.servidor.eliminarPartida(partidaId);
  }

  /**
   * Maneja la desconexión de un socket.
   * Marca al jugador como desconectado y actualiza el estado de la partida.
   * Si la partida queda vacía, la elimina.
   * 
   * @param socketID - ID del socket desconectado.
   */
  public manejarDesconexion(socketID: string) {
    for (const [id, partida] of this.servidor.partidasActivas.entries()) {
      if (partida.jugadores.has(socketID)) {
        const jugador = partida.obtenerJugador(socketID)!;
        jugador.conectado = false;
        partida.removerJugador(socketID);

        this.io.to(id).emit('players_update', partida.getJugadoresResumen());
        this.emitirListaPartidas(); // Actualizar lobby si alguien se desconecta de una partida en espera

        if (partida.jugadores.size === 0) {
          this.servidor.eliminarPartida(id);
          this.emitirListaPartidas(); // Actualizar lobby si se elimina
        }
        break;
      }
    }
  }

  /**
   * Intenta reconectar a un jugador que perdió la conexión.
   * Busca al jugador por su ID de base de datos en la partida especificada o en todas las activas.
   * 
   * @param partidaId - (Opcional) ID de la partida donde buscar.
   * @param jugadorDBId - ID de base de datos del jugador.
   * @param nuevoSocketID - Nuevo ID de socket asignado al reconectar.
   * @returns Objeto con ID de partida y resumen de jugadores si tiene éxito, o null.
   */
  public async reconnectPlayer(partidaId: string | undefined, jugadorDBId: number, nuevoSocketID: string) {
    const buscarEnPartida = (p: any): Jugador | null => {
      for (const j of Array.from(p.jugadores.values()) as Jugador[]) {
        if (j.idDB === jugadorDBId) return j;
      }
      return null;
    };

    if (partidaId) {
      const partida = this.servidor.obtenerPartida(partidaId);
      if (!partida) return null;
      const jugador = buscarEnPartida(partida);
      if (!jugador) return null;

      // Cambiar key en el map: remover vieja entrada y reasignar con nuevo socketID
      const viejoSocketID = jugador.socketID;
      partida.removerJugador(viejoSocketID);
      jugador.socketID = nuevoSocketID;
      jugador.conectado = true;
      partida.jugadores.set(nuevoSocketID, jugador);

      return { partidaId: partidaId, jugadoresResumen: partida.getJugadoresResumen() };
    } else {
      // Buscar en todas las partidas
      for (const [id, partida] of this.servidor.partidasActivas.entries()) {
        const jugador = buscarEnPartida(partida);
        if (jugador) {
          const viejoSocketID = jugador.socketID;
          partida.removerJugador(viejoSocketID);
          jugador.socketID = nuevoSocketID;
          jugador.conectado = true;
          partida.jugadores.set(nuevoSocketID, jugador);

          return { partidaId: id, jugadoresResumen: partida.getJugadoresResumen() };
        }
      }
      return null;
    }
  }

  /**
   * Genera una lista de partidas disponibles para mostrar en el lobby.
   * Filtra partidas en espera y que no estén llenas.
   * 
   * @returns Array de objetos con información resumida de las partidas.
   */
  public listarPartidasDisponibles() {
    return Array.from(this.servidor.partidasActivas.values())
      .filter(p => p.estado === 'espera' && !p.estaLlena())
      .map(p => ({
        id: p.idPartida,
        tipo: p.tipoJuego,
        tematica: p.tematica,
        jugadores: p.jugadores.size,
        jugadoresNombres: Array.from(p.jugadores.values()).map(j => j.nickname),
        maxJugadores: p.numJugadoresMax,
        tiempoRestante: TimerManager.getInstance().getRemainingTime(p.idPartida),
        // Enviar configuración de duración/límite para mostrar en lobby
        duracionMinutos: p.tipoJuego === 'Tiempo' ? (p.duracionPartida || 3) : undefined,
        limiteMatches: p.tipoJuego === 'Match' ? config.MATCH_FINITO_LIMITE : undefined
      }));
  }

  /**
   * Emite la lista actualizada de partidas a todos los clientes conectados al lobby.
   */
  private emitirListaPartidas() {
    const partidas = this.listarPartidasDisponibles();
    this.io.to('lobby').emit('partidas:list', partidas);
  }
}
