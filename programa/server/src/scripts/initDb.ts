import pool from '../core/repositories/dbPool.js';
import Logger from '../utils/Logger.js';

export async function initDb() {
    const conn = await pool.getConnection();
    try {
        Logger.info('[DB] Inicializando base de datos...');

        // 1. Tabla de Jugadores
        await conn.query(`
            CREATE TABLE IF NOT EXISTS jugador (
                id_jugador INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(50) NOT NULL UNIQUE,
                fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Tabla de Partidas
        await conn.query(`
            CREATE TABLE IF NOT EXISTS partida (
                id_partida INT AUTO_INCREMENT PRIMARY KEY,
                codigo_partida VARCHAR(50) NOT NULL UNIQUE,
                tipo_juego VARCHAR(20) NOT NULL,
                tematica VARCHAR(50) NOT NULL,
                num_jugadores INT NOT NULL,
                fecha_inicio DATETIME,
                fecha_fin DATETIME,
                id_ganador_principal INT,
                FOREIGN KEY (id_ganador_principal) REFERENCES jugador(id_jugador)
            );
        `);

        // 3. Tabla Intermedia (Resultados y Relación)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS partida_jugador (
                id_partida INT,
                id_jugador INT,
                puntaje_final INT DEFAULT 0,
                es_ganador TINYINT(1) DEFAULT 0,
                tiempo_invertido INT,
                PRIMARY KEY(id_partida, id_jugador),
                FOREIGN KEY (id_partida) REFERENCES partida(id_partida),
                FOREIGN KEY (id_jugador) REFERENCES jugador(id_jugador)
            );
        `);

        Logger.info('[DB] Tablas verificadas/creadas correctamente.');
    } catch (error) {
        Logger.error('[DB] Error inicializando base de datos:', error);
        throw error;
    } finally {
        conn.release();
    }
}
