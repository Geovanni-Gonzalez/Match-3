// server/src/core/repositories/PartidaRepo.ts
import pool from './dbPool.js';
import Logger from '../../utils/Logger.js';

export class PartidaRepo {
    static async crearPartida(codigo: string, tipo: string, tematica: string, maxJugadores: number) {
        const conn = await pool.getConnection();
        try {
            const [res] = await conn.execute('INSERT INTO partida (codigo_partida, tipo_juego, tematica, num_jugadores, fecha_inicio, fecha_fin, id_ganador_principal) VALUES (?, ?, ?, ?, NULL, NULL, NULL)', [codigo, tipo, tematica, maxJugadores]);
            return (res as any).insertId;
        } finally {
            conn.release();
        }
    }
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
                maxJugadores: p.num_jugadores
            };
        } finally {
            conn.release();
        }
    }

    static async agregarJugadorAPartida(idPartidaCodigo: string, idJugador: number) {
        const conn = await pool.getConnection();
        Logger.info('[PartidaRepo] Agregando jugador a partida', { idJugador, codigoPartida: idPartidaCodigo });
        try {
            // Obtener id_partida por codigo_partida
            const [rows] = await conn.execute('SELECT id_partida FROM partida WHERE codigo_partida = ? LIMIT 1', [idPartidaCodigo]);
            if ((rows as any).length === 0) throw new Error('Partida no encontrada (codigo)');
            const idPartida = (rows as any)[0].id_partida;
            await conn.execute(
                'INSERT INTO partida_jugador (id_partida, id_jugador, puntaje_final, tiempo_invertido, es_ganador) VALUES (?, ?, NULL, NULL, NULL)',
                [idPartida, idJugador]
            );
        } finally {
            conn.release();
        }
    }


    /**
     * Guarda resultados finales para la partida (lista de objetos { idJugador, puntaje, esGanador, tiempoInvertido })
     */
    static async guardarResultadosFinales(idPartidaCodigo: string, resultados: { idJugador: number, puntaje: number, esGanador: boolean, tiempoInvertido: number }[]) {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.execute('SELECT id_partida FROM partida WHERE codigo_partida = ? LIMIT 1', [idPartidaCodigo]);
            if ((rows as any).length === 0) throw new Error('Partida no encontrada (codigo)');
            const idPartida = (rows as any)[0].id_partida;

            const updatePromises = resultados.map(r => {
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
                fecha: r.fecha_fin
            }));
        } catch (err) {
            Logger.error('Error obteniendo ranking', { error: err });
            return [];
        } finally {
            conn.release();
        }
    }
}
