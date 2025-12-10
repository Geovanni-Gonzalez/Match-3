/**
 * @file PlayerRepo.ts
 * @description Repositorio de acceso a datos para la entidad Jugador.
 *
 * Gestiona la creación y recuperación de jugadores en la base de datos.
 */

import pool from './dbPool.js';
import Logger from '../../utils/Logger.js';

export class PlayerRepo {
  /**
   * Busca un jugador por su nickname o lo crea si no existe.
   *
   * @param nickname - Nombre de usuario del jugador.
   * @returns ID del jugador (existente o nuevo).
   */
  static async findOrCreateByNickname(nickname: string) {
    const conn = await pool.getConnection();
    try {
      Logger.info('[PlayerRepo] Buscando o creando jugador', { nickname });
      const [rows] = await conn.execute('SELECT id_jugador FROM jugador WHERE nombre = ?', [nickname]);
      if ((rows as any).length > 0) return (rows as any)[0].id_jugador;
      const [res] = await conn.execute('INSERT INTO jugador (nombre, fecha_registro) VALUES (?, NOW())', [nickname]);
      Logger.info('[PlayerRepo] Jugador creado', { id: (res as any).insertId });
      return (res as any).insertId;
    } finally {
      conn.release();
    }
  }
}
