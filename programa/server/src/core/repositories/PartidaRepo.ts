/**
 * @file PartidaRepo.ts
 * @description Repositorio de acceso a datos para la entidad Partida.
 *
 * Encapsula todas las consultas SQL relacionadas con la creación, actualización
 * y consulta de partidas y sus resultados.
 */

import pool from './dbPool.js';
import Logger from '../../utils/Logger.js';

export class PartidaRepo {
  /**
   * Crea un nuevo registro de partida en la base de datos.
   * Inicializa fechas y ganador como NULL.
   *
   * @param codigo - Código único de la partida (generado por el servidor).
   * @param tipo - Tipo de juego ('Match' o 'Tiempo').
   * @param tematica - Temática visual seleccionada.
   * @param maxJugadores - Número máximo de jugadores permitidos.
   * @returns ID autogenerado de la inserción.
   */
  static async crearPartida(codigo: string, tipo: string, tematica: string, maxJugadores: number) {
    const conn = await pool.getConnection();
    try {
      const [res] = await conn.execute(
        'INSERT INTO partida (codigo_partida, tipo_juego, tematica, num_jugadores, fecha_inicio, fecha_fin, id_ganador_principal) VALUES (?, ?, ?, ?, NULL, NULL, NULL)',
        [codigo, tipo, tematica, maxJugadores]
      );
      return (res as any).insertId;
    } finally {
      conn.release();
    }
  }

  /**
   * Busca una partida activa por su código.
   * Filtra partidas que ya han finalizado (tienen fecha_fin).
   *
   * @param codigo - Código de la partida.
   * @returns Objeto con datos básicos de la partida o null si no existe o ya finalizó.
   */
  static async obtenerPorCodigo(codigo: string) {
    const conn = await pool.getConnection();
    try {
      const query = `
                SELECT codigo_partida, tipo_juego, tematica, num_jugadores, fecha_fin 
                FROM partida 
                WHERE codigo_partida = ? 
                LIMIT 1
            `;
      const [rows] = await conn.execute(query, [codigo]);

      if ((rows as any).length === 0) return null;

      const p = (rows as any)[0];

      // Si la partida ya tiene fecha_fin, no se debe reactivar
      if (p.fecha_fin) return null;

      return {
        id: p.codigo_partida,
        tipo: p.tipo_juego,
        tematica: p.tematica,
        maxJugadores: p.num_jugadores,
      };
    } finally {
      conn.release();
    }
  }

  /**
   * Asocia un jugador a una partida en la tabla intermedia `partida_jugador`.
   * Inicializa puntaje y estado de ganador en 0.
   *
   * @param idPartidaCodigo - Código de la partida.
   * @param idJugador - ID del jugador en la base de datos.
   * @throws Error si la partida no se encuentra por su código.
   */
  static async agregarJugadorAPartida(idPartidaCodigo: string, idJugador: number) {
    const conn = await pool.getConnection();
    Logger.info('[PartidaRepo] Agregando jugador a partida', { idJugador, codigoPartida: idPartidaCodigo });
    try {
      // Obtener id_partida por codigo_partida
      const [rows] = await conn.execute('SELECT id_partida FROM partida WHERE codigo_partida = ? LIMIT 1', [
        idPartidaCodigo,
      ]);
      if ((rows as any).length === 0) throw new Error('Partida no encontrada (codigo)');
      const idPartida = (rows as any)[0].id_partida;
      await conn.execute(
        'INSERT INTO partida_jugador (id_partida, id_jugador, puntaje_final, tiempo_invertido, es_ganador) VALUES (?, ?, 0, 0, 0)',
        [idPartida, idJugador]
      );
    } finally {
      conn.release();
    }
  }

  /**
   * Actualiza la fecha de inicio de la partida al momento actual.
   * Se llama cuando comienza el juego real.
   *
   * @param codigoPartida - Código de la partida.
   */
  static async marcarInicioPartida(codigoPartida: string) {
    const conn = await pool.getConnection();
    try {
      await conn.execute('UPDATE partida SET fecha_inicio = NOW() WHERE codigo_partida = ?', [codigoPartida]);
    } finally {
      conn.release();
    }
  }

  /**
   * Guarda los resultados finales de una partida.
   *
   * Acciones:
   * 1. Actualiza la tabla `partida` con fecha de fin y el ID del ganador principal.
   * 2. Actualiza la tabla `partida_jugador` para cada participante con su puntaje, tiempo y estado de victoria.
   *
   * @param idPartidaCodigo - Código de la partida.
   * @param resultados - Lista de resultados individuales de los jugadores.
   * @param idGanadorPrincipal - ID del jugador ganador (o null si empate/nadie).
   */
  static async guardarResultadosFinales(
    idPartidaCodigo: string,
    resultados: { idJugador: number; puntaje: number; esGanador: boolean; tiempoInvertido: number }[],
    idGanadorPrincipal: number | null
  ) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute('SELECT id_partida FROM partida WHERE codigo_partida = ? LIMIT 1', [
        idPartidaCodigo,
      ]);
      if ((rows as any).length === 0) throw new Error('Partida no encontrada (codigo)');
      const idPartida = (rows as any)[0].id_partida;

      // 1. Actualizar tabla partida (fecha_fin, ganador)
      await conn.execute('UPDATE partida SET fecha_fin = NOW(), id_ganador_principal = ? WHERE id_partida = ?', [
        idGanadorPrincipal,
        idPartida,
      ]);

      // 2. Actualizar tabla partida_jugador
      const updatePromises = resultados.map((r) => {
        return conn.execute(
          'UPDATE partida_jugador SET puntaje_final = ?, es_ganador = ?, tiempo_invertido = ? WHERE id_partida = ? AND id_jugador = ?',
          [r.puntaje, r.esGanador ? 1 : 0, r.tiempoInvertido, idPartida, r.idJugador]
        );
      });

      await Promise.all(updatePromises);
    } finally {
      conn.release();
    }
  }

  /**
   * Obtiene el ranking histórico de los mejores jugadores (ganadores).
   * Ordenado por puntaje descendente.
   *
   * @returns Lista de los top 20 ganadores con detalles de la partida.
   */
  static async obtenerRankingHistorico() {
    const conn = await pool.getConnection();
    try {
      // Ranking detallado: Nombre, Puntaje, Temática, Tiempo, ID Partida
      const query = `
                SELECT 
                    j.nombre as user, 
                    pj.puntaje_final as puntaje, 
                    p.tematica, 
                    pj.tiempo_invertido, 
                    p.codigo_partida as gameId,
                    p.fecha_fin
                FROM partida_jugador pj
                JOIN jugador j ON pj.id_jugador = j.id_jugador
                JOIN partida p ON pj.id_partida = p.id_partida
                WHERE pj.es_ganador = 1
                ORDER BY pj.puntaje_final DESC
                LIMIT 20
            `;
      const [rows] = await conn.execute(query);
      return (rows as any[]).map((r, i) => ({
        rank: i + 1,
        user: r.user,
        puntaje: r.puntaje,
        tematica: r.tematica,
        tiempo: r.tiempo_invertido,
        gameId: r.gameId,
        fecha: r.fecha_fin,
      }));
    } catch (err) {
      Logger.error('Error obteniendo ranking', { error: err });
      return [];
    } finally {
      conn.release();
    }
  }
}
