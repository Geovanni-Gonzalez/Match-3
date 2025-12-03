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

  async handleMatchExpiration(matchId: string) {
    const match = this.servidor.obtenerPartida(matchId);
    if (!match) return;

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
  }

  /**
   * Crear partida: persiste en BD y en memoria
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
    );

    return partida;
  }

  public obtenerPartida(idPartida: string) {
    return this.servidor.obtenerPartida(idPartida);
  }

  /**
   * Unirse a partida: crea Jugador domain y lo agrega; persiste relación jugador-partida.
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

    return nuevoJugador;
  }
  /**
   *  Eliminar partida
   */
  public eliminarPartida(idPartida: string) {
    this.servidor.eliminarPartida(idPartida);
  }
  /**
   * Set ready / not ready  
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

  public iniciarPartida(partidaId: string, requestedBySocketID?: string) {
    const partida = this.servidor.obtenerPartida(partidaId);
    if (!partida) throw new Error('Partida no encontrada');
    if (partida.estado !== 'espera') throw new Error('Partida ya iniciada');

    // Si se solicita por un socket específico, verificar que sea el host
    if (requestedBySocketID) {
      if (partida.hostSocketID !== requestedBySocketID) {
        throw new Error('Solo el anfitrión puede iniciar la partida');
      }
    }

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

  private comenzarJuegoReal(partida: any) {
    const partidaId = partida.idPartida;
    partida.setEstado('jugando');

    const tableroSerializado = partida.tablero.matriz.map((row: any[]) => row.map((c: any) => ({ colorID: c.colorID, estado: c.estado })));
    
    // Enviar configuración específica según el modo
    const gameConfig = {
      ...config,
      limit: partida.tipoJuego === 'Match' ? config.MATCH_FINITO_LIMITE : (config.TIEMPO_VIDA_PARTIDA_MIN * 60) // Ajustar según config real de tiempo de juego
    };

    this.io.to(partidaId).emit('game_started', { tablero: tableroSerializado, config: gameConfig });
    this.io.to(partidaId).emit('players_update', partida.getJugadoresResumen());

    // Iniciar condiciones de fin de juego
    if (partida.tipoJuego === 'Tiempo') {
      // Usar un tiempo de juego por defecto (ej. 3 minutos) o el configurado
      const duracionSegundos = 3 * 60; 
      TimerManager.getInstance().startTimer(partidaId, duracionSegundos, () => {
        console.log(`[GameService] Tiempo de juego agotado para ${partidaId}`);
        this.finalizarPartida(partidaId);
      });
    }
  }

  public manejarSeleccion(partidaId: string, socketID: string, r: number, c: number) {
    const partida = this.servidor.obtenerPartida(partidaId);
    if (!partida) return;
    if (partida.estado !== 'jugando') return;

    const jugador = partida.obtenerJugador(socketID);
    if (!jugador) return;

    const celda = partida.tablero.obtenerCelda(r, c);
    if (!celda) return;

    const yaSeleccionada = jugador.celdasSeleccionadas.some((s: Coordenada) => s.r === r && s.c === c);
    if (yaSeleccionada) {
      jugador.agregarCelda(r, c);
      celda.establecerEstado('libre');
    } else {
      if (jugador.celdasSeleccionadas.length >= config.MATCH_FINITO_LIMITE) return;
      jugador.agregarCelda(r, c);
      celda.establecerEstado('seleccion_propia');

      // marcar para otros: por cada otro jugador marcar 'seleccion_otro' en esa celda
      for (const [sock, other] of partida.jugadores.entries()) {
        if (sock !== socketID) {
          // Solo si otro no tiene esa celda seleccionada
          const has = other.celdasSeleccionadas.some((s: { r: number; c: number; }) => s.r === r && s.c === c);
          if (!has) {
            // marca la celda como ocupada por otro (esto será visible en la emisión)
            celda.establecerEstado('bloqueada'); // o 'seleccion_otro' según tu UI
          }
        }
      }
    }

    this.emitirEstadoPartida(partidaId);
  }

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
      partida.tablero.matriz.forEach((row: any[]) => row.forEach((c: any) => c.establecerEstado('libre')));
      this.emitirEstadoPartida(partidaId);
      this.io.to(socketID).emit('match_result', { valido: false });
      return;
    }

    // Válido: actualizar puntaje y tablero
    jugador.calcularPuntaje(resultado.n);
    partida.tablero.actualizarCeldas(resultado.celdas);
    partida.matchesRealizados = (partida.matchesRealizados || 0) + 1;

    jugador.limpiarSelecciones();
    partida.tablero.matriz.forEach((row: any[]) => row.forEach((c: any) => c.establecerEstado('libre')));

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
      r: c.fila, c: c.columna, colorID: c.colorID, estado: c.estado
    })));

    this.io.to(partidaId).emit('players_update', partida.getJugadoresResumen());
    this.io.to(partidaId).emit('board_update', { tablero: tableroSerializado });
  }

  /**
   * Finaliza la partida: calcula ganador/es y persiste resultados en BD
   */
  public async finalizarPartida(partidaId: string) {
    const partida = this.servidor.obtenerPartida(partidaId);
    if (!partida) throw new Error('Partida no encontrada');
    if (partida.estado === 'finalizada') return;

    partida.setEstado('finalizada');

    // Asegurar el tipo correcto para que TypeScript reconozca las propiedades de Jugador
    const resultadosOrdenados = Array.from(partida.jugadores.values()) as Jugador[];
    resultadosOrdenados.sort((a, b) => b.puntaje - a.puntaje);
    const ganador = resultadosOrdenados[0];

    // Preparar resultados para persistir (idDB, puntaje, esGanador)
    const resultadosForDb = resultadosOrdenados.map((j: Jugador) => ({
      idJugador: j.idDB,
      puntaje: j.puntaje,
      esGanador: !!(ganador && ganador.puntaje > 0 && j.puntaje === ganador.puntaje)
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

        if (partida.jugadores.size === 0) {
          this.servidor.eliminarPartida(id);
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
      .filter(p => p.estado === 'espera')
      .map(p => ({
        id: p.idPartida,
        tipo: p.tipoJuego,
        tematica: p.tematica,
        jugadores: p.jugadores.size,
        maxJugadores: p.numJugadoresMax,
        tiempoRestante: TimerManager.getInstance().getRemainingTime(p.idPartida)
      }));
  }
}
