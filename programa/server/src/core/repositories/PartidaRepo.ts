// server/src/core/repositories/PartidaRepo.ts
import pool from './dbPool';

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

    static async agregarJugadorAPartida(idPartidaCodigo: string, idJugador: number) {
        const conn = await pool.getConnection();
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
     * Guarda resultados finales para la partida (lista de objetos { idJugador, puntaje, esGanador })
     */
    static async guardarResultadosFinales(idPartidaCodigo: string, resultados: { idJugador: number, puntaje: number, esGanador: boolean }[]) {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.execute('SELECT id_partida FROM partida WHERE codigo_partida = ? LIMIT 1', [idPartidaCodigo]);
            if ((rows as any).length === 0) throw new Error('Partida no encontrada (codigo)');
            const idPartida = (rows as any)[0].id_partida;

            const updatePromises = resultados.map(r => {
                return conn.execute(
                    'UPDATE partida_jugador SET puntaje_final = ?, es_ganador = ? WHERE id_partida = ? AND id_jugador = ?',
                    [r.puntaje, r.esGanador ? 1 : 0, idPartida, r.idJugador]
                );
            });

            await Promise.all(updatePromises);
        } finally {
            conn.release();
        }
    }
}
