import pool from './core/repositories/dbPool.js';

async function testDb() {
  try {
    console.log('Intentando conectar a la BD...');
    const conn = await pool.getConnection();
    console.log('Conexión exitosa!');
    
    console.log('Verificando tabla jugador...');
    const [rows] = await conn.execute("DESCRIBE jugador");
    console.log('Estructura de jugador:', rows);
    
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('Error conectando a la BD:', err);
    process.exit(1);
  }
}

testDb();
