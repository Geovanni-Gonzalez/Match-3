// server/src/core/repositories/PlayerRepo.ts
import pool from './dbPool.js';


export class PlayerRepo {
    static async findOrCreateByNickname(nickname: string) {
        const conn = await pool.getConnection();
        try {
            console.log('[PlayerRepo] Buscando o creando jugador con nickname:', nickname);
            const [rows] = await conn.execute('SELECT id_jugador FROM jugador WHERE nickname = ?', [nickname]);
            if ((rows as any).length > 0) return (rows as any)[0].id_jugador;
            const [res] = await conn.execute('INSERT INTO jugador (nickname, fecha_registro) VALUES (?, NOW())', [nickname]);
            console.log('[PlayerRepo] Jugador creado con ID:', (res as any).insertId);
            return (res as any).insertId;
        } finally {
            conn.release();
        }
    }
}
