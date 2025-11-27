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
                return result.insertId; // Retornar el ID del nuevo jugador
            } catch (error) {
                console.error('Error en DBManager.registrarJugador:', error);
                throw error;
            } finally {
                connection.release();
            }
    }
}