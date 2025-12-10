/**
 * @file TimerManager.ts
 * @description Gestor centralizado de temporizadores para las partidas.
 *
 * Este Singleton se encarga de:
 * - Crear y gestionar cuentas regresivas (timeouts).
 * - Emitir eventos de "tick" cada segundo a los clientes (intervalos).
 * - Sincronizar el tiempo restante entre el servidor y los clientes (Lobby y Juego).
 */

import { Server } from 'socket.io';

interface TimerData {
  timeout: NodeJS.Timeout;
  interval?: NodeJS.Timeout;
  expiresAt: number;
}

export class TimerManager {
  /** Mapa de timers activos por ID de partida. */
  private timers: Map<string, TimerData> = new Map();
  /** Referencia al servidor de sockets para emitir eventos. */
  private io: Server | null = null;

  public constructor() {}

  /**
   * Configura la instancia de Socket.IO necesaria para emitir eventos de tiempo.
   * @param io - Instancia del servidor Socket.IO.
   */
  setSocketServer(io: Server) {
    this.io = io;
  }

  /**
   * Inicia un temporizador para una partida específica.
   *
   * @param partidaId - ID de la partida.
   * @param seconds - Duración del temporizador en segundos.
   * @param onExpire - Callback a ejecutar cuando el tiempo se agota.
   * @param type - Tipo de timer ('lobby', 'game', etc.) para contexto en el cliente.
   */
  startTimer(partidaId: string, seconds: number, onExpire: () => void, type: string = 'general') {
    this.clearTimer(partidaId);

    const expiresAt = Date.now() + seconds * 1000;

    // Timeout principal que ejecuta la acción al finalizar
    const timeout = setTimeout(() => {
      try {
        onExpire();
      } catch (err) {
        console.error('[TimerManager] onExpire error:', err);
      } finally {
        this.clearTimer(partidaId);
      }
    }, seconds * 1000);

    // Intervalo para notificar a los clientes cada segundo
    const interval = setInterval(() => {
      if (!this.io) return;
      const secondsLeft = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));

      // Emitir a la sala de la partida
      this.io.to(partidaId).emit('game:timer_tick', {
        secondsLeft,
        type,
      });

      // Emitir al lobby general (para mostrar tiempo restante en la lista)
      this.io.to('lobby').emit('game:timer_tick', { secondsLeft, partidaId, type });

      if (secondsLeft <= 0) clearInterval(interval);
    }, 1000);

    this.timers.set(partidaId, { timeout, interval, expiresAt });
  }

  /**
   * Detiene y elimina cualquier timer activo para una partida.
   * @param partidaId - ID de la partida.
   */
  clearTimer(partidaId: string) {
    const t = this.timers.get(partidaId);
    if (!t) return;
    clearTimeout(t.timeout);
    if (t.interval) clearInterval(t.interval);
    this.timers.delete(partidaId);
  }

  /**
   * Obtiene el tiempo restante en segundos para una partida.
   * @param partidaId - ID de la partida.
   * @returns Segundos restantes o 0 si no hay timer.
   */
  getRemainingTime(partidaId: string) {
    const t = this.timers.get(partidaId);
    if (!t) return 0;
    return Math.max(0, Math.round((t.expiresAt - Date.now()) / 1000));
  }
}
