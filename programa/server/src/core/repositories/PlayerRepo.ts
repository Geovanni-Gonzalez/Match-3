// server/src/core/repositories/PlayerRepo.ts
import pool from './dbPool';


export class PlayerRepo {
    static async findOrCreateByNickname(nickname: string) {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.execute('SELECT id_jugador FROM jugador WHERE nickname = ?', [nickname]);
            if ((rows as any).length > 0) return (rows as any)[0].id_jugador;
            const [res] = await conn.execute('INSERT INTO jugador (nickname, fecha_registro) VALUES (?, NOW())', [nickname]);
            return (res as any).insertId;
        } finally {
            conn.release();
        }
    }
}
