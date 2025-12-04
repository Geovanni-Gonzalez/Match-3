// server/src/core/services/GameService.ts
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

  constructor(private io: Server) {
    TimerManager.getInstance().setSocketServer(io);
  }

  /**
   * Maneja la expiración del tiempo de espera de una partida en el lobby.
   * Si hay suficientes jugadores (>=2), inicia la partida automáticamente.
   * Si no, la elimina.
   * @param matchId ID de la partida
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
   * Configura el temporizador de vida útil de la partida.
   * 
   * @param idPartida Código único de la partida
   * @param tipoJuego 'Match' o 'Tiempo'
   * @param tematica Temática visual del juego
   * @param max Número máximo de jugadores
   * @returns La instancia de la partida creada
   */
  public async crearPartida(idPartida: string, tipoJuego: 'Match' | 'Tiempo', tematica: string, max: number) {
    console.log('[GameService] Creando partida:', idPartida, tipoJuego, tematica, max);

    // Crear en memoria
    const partida = this.servidor.crearPartida(idPartida, tipoJuego, tematica, max);

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

  public obtenerPartida(idPartida: string) {
    return this.servidor.obtenerPartida(idPartida);
  }

  /**
   * Permite a un jugador unirse a una partida existente.
   * Crea la instancia del jugador y persiste la relación en la BD.
   * 
   * @param idPartida ID de la partida
   * @param nickname Nombre del jugador
   * @param socketID ID del socket de conexión
   * @param jugadorDBId ID del jugador en la base de datos
   * @returns La instancia del nuevo jugador
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
   * Elimina una partida de la memoria del servidor.
   * @param idPartida ID de la partida a eliminar
   */
  public eliminarPartida(idPartida: string) {
    TimerManager.getInstance().clearTimer(idPartida);
    this.servidor.eliminarPartida(idPartida);
    this.emitirListaPartidas(); // Notificar eliminación
  }

  /**
   * Actualiza el estado de "listo" de un jugador.
   * Si todos los jugadores están listos, emite el evento 'all_players_ready'.
   * 
   * @param partidaId ID de la partida
   * @param socketID ID del socket del jugador
   * @param isReady Nuevo estado de listo
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
   * Esto envía el tablero inicial a los clientes para que puedan renderizarlo, pero sin iniciar el juego.
   * Solo el anfitrión puede solicitar esto.
   *
   * @param partidaId ID de la partida
   * @param requestedBySocketID Socket ID de quien solicita preparar la partida (debe ser el host)
   */
  public prepararPartida(partidaId: string, requestedBySocketID: string) {
    const partida = this.servidor.obtenerPartida(partidaId);
    if (!partida) throw new Error('Partida no encontrada');
    if (partida.estado !== 'espera') throw new Error('La partida no está en espera para ser preparada.');

    // Verificar que quien solicita sea el host
    if (partida.hostSocketID !== requestedBySocketID) {
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
   * Inicia la secuencia de arranque de la partida (cuenta regresiva).
   * Valida que la partida esté en espera y que quien la inicia sea el host (si aplica).
   * 
   * @param partidaId ID de la partida
   * @param requestedBySocketID (Opcional) Socket ID de quien solicita iniciar
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
   * Inicializa el tablero, envía configuración a clientes e inicia timers de juego si aplica.
   * @param partida Instancia de la partida
   */
  private comenzarJuegoReal(partida: any) {
    const partidaId = partida.idPartida;
    partida.setEstado('jugando');
    partida.startTime = Date.now();

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
      // Usar un tiempo de juego por defecto (ej. 3 minutos) o el configurado
      const duracionSegundos = 3 * 60;
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
   * @param partidaId ID de la partida
   * @param socketID ID del jugador
   * @param r Fila seleccionada
   * @param c Columna seleccionada
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
   * Si es válido: suma puntos, actualiza tablero y notifica.
   * Si es inválido: limpia selección y notifica error.
   * 
   * @param partidaId ID de la partida
   * @param socketID ID del jugador
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
   * Finaliza la partida: calcula ganador/es y persiste resultados en BD
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

    try {
      await PartidaRepo.guardarResultadosFinales(partidaId, resultadosForDb);
    } catch (err) {
      console.warn('[GameService] No se pudo persistir resultados finales:', err);
    }

    // Emitir estado final
    this.io.to(partidaId).emit('game_finished', { resultados: partida.getJugadoresResumen() });

    // Opcional: eliminar partida en memoria (según política)
    // this.servidor.eliminarPartida(partidaId);
  }

  /**
   * Manejo de desconexión: ya implementado
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
   * Re-attach / Reconnect player:
   * Si se proporciona partidaId, intentará re-conectar en esa partida.
   * Si no se proporciona, buscará por jugador idDB en todas las partidas activas.
   *
   * Retorna { partidaId, jugadoresResumen } en éxito, o null si no encontró nada.
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

  public listarPartidasDisponibles() {
    return Array.from(this.servidor.partidasActivas.values())
      .filter(p => p.estado === 'espera' && !p.estaLlena())
      .map(p => ({
        id: p.idPartida,
        codigo: p.idPartida,
        tipo: p.tipoJuego,
        tematica: p.tematica,
        jugadores: p.jugadores.size,
        maxJugadores: p.numJugadoresMax,
        tiempoRestante: TimerManager.getInstance().getRemainingTime(p.idPartida),
        duracionMinutos: p.duracionPartida
      }));
  }

  /**
   * Emite la lista actualizada de partidas a todos los clientes en el lobby.
   */
  private emitirListaPartidas() {
    const partidas = this.listarPartidasDisponibles();
    this.io.to('lobby').emit('partidas:list', partidas);
  }
}
