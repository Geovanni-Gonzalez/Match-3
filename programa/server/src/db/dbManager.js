// server/src/db/dbManager.ts
import pool from './dbPool.js';

export class DBManager {

    static async registrarJugador(nickname) {
            const connection = await pool.getConnection(); 
            try {
                // Verificar si el nickname ya existe
                const [rows] = await connection.execute(
                    'SELECT id_jugador FROM jugador WHERE nickname = ?',
                    [nickname]
                );
                if (rows.length > 0) {
                    // Si existe, retornar el ID existente
                    return rows[0].id_jugador;
                }
                // Si no existe, insertar nuevo jugador
                const [result] = await connection.execute(
                    'INSERT INTO jugador (nickname, fecha_registro) VALUES (?, NOW())',
                    [nickname]
                );
                return result.insertId; // Retornar el ID asignado al nuevo jugador
            } catch (error) {
                console.error('[DB] Error en DBManager.registrarJugador:', error);
                throw error;
            } finally {
                console.log('[DB] Jugador registrado con nickname:', nickname);
                connection.release();
            }
    }

    static async registrarPartida(coodigoPartida, tipoJuego, tematica, numJugadoresMax) {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                'INSERT INTO partida (codigo_partida, tipo_juego, tematica, num_jugadores, fecha_inicio, fecha_fin, id_ganador_principal) VALUES (?, ?, ?, ?, NULL, NULL, NULL)',
                [coodigoPartida, tipoJuego, tematica, numJugadoresMax]
            );
            return result.insertId; // Retornar el ID de la nueva partida
        } catch (error) {
            console.error('[DB] Error en DBManager.registrarPartida:', error);
            throw error;
        } finally {
            console.log('[DB] Partida registrada con código:', coodigoPartida);
            connection.release();
        }
    }

    // Jugador se une a una partida
    static async unirJugadorAPartida(idJugador, idPartida) {
        const connection = await pool.getConnection();
        try {
            await connection.execute(
                'INSERT INTO partida_jugador (id_partida, id_jugador, puntaje_final, tiempo_invertido, es_ganador) VALUES (?, ?, NULL, NULL, NULL)',
                [idPartida, idJugador]
            );
        } catch (error) {
            console.error('[DB] Error en DBManager.unirJugadorAPartida:', error);
            throw error;
        } finally {
            console.log('[DB] Jugador', idJugador, 'se unió a la partida', idPartida);
            connection.release();
        }
    }
}
export default DBManager;