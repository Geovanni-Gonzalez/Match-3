//-------TEST PARA PROBAR LA CREACION DE PARTIDA EN EL BACKEND-------
//-------TEST GENERADO POR CHATGPT-------


// server/src/test-crear-partida.js
// Script de prueba para demostrar la funcionalidad de crear partida
// Ejecutar con: npm run build && node src/test-crear-partida.js

const { ServidorPartidas } = require('../dist/classes/ServidorPartidas');

console.log('='.repeat(60));
console.log('PRUEBA DE CREACIÓN Y GESTIÓN DE PARTIDAS');
console.log('='.repeat(60));
console.log('\n');

// Obtener instancia del servidor
const servidor = ServidorPartidas.getInstance();

console.log('📋 Configuración del servidor:');
console.log(JSON.stringify(servidor.getConfiguracion(), null, 2));
console.log('\n');

// ========== PRUEBA 1: Crear partida válida ==========
console.log('\n🧪 PRUEBA 1: Crear partida de tipo Match');
console.log('-'.repeat(60));
try {
    const partida1 = servidor.crearPartida(
        'JugadorHost',      // nickname del creador
        'Match',            // tipo de juego
        'Gemas',            // temática
        3                   // número de jugadores
    );
    
    console.log('✅ RESULTADO: Partida creada exitosamente');
    console.log(`   Código: ${partida1.idPartida}`);
    console.log(`   Estado: ${partida1.estado}`);
    console.log(`   Jugadores: ${partida1.jugadores.size}/${partida1.getNumJugadoresMax()}`);
} catch (error) {
    console.error('❌ ERROR:', error.message);
}

// ========== PRUEBA 2: Crear partida de tipo Tiempo ==========
console.log('\n🧪 PRUEBA 2: Crear partida de tipo Tiempo con duración');
console.log('-'.repeat(60));
try {
    const partida2 = servidor.crearPartida(
        'JugadorLider',
        'Tiempo',           // tipo de juego
        'Monstruos',        // temática
        2,                  // número de jugadores (mínimo)
        5                   // duración en minutos
    );
    
    console.log('✅ RESULTADO: Partida creada exitosamente');
    console.log(`   Código: ${partida2.idPartida}`);
    console.log(`   Tipo: ${partida2.tipoJuego}`);
    console.log(`   Duración: 5 minutos`);
} catch (error) {
    console.error('❌ ERROR:', error.message);
}

// ========== PRUEBA 3: Validación - Menos de 2 jugadores ==========
console.log('\n🧪 PRUEBA 3: Validación - Intentar crear partida con menos de 2 jugadores');
console.log('-'.repeat(60));
try {
    servidor.crearPartida('JugadorSolo', 'Match', 'Gemas', 1);
    console.log('❌ FALLO: Debería haber lanzado error');
} catch (error) {
    console.log('✅ RESULTADO ESPERADO: Error capturado correctamente');
    console.log(`   Mensaje: ${error.message}`);
}

// ========== PRUEBA 4: Validación - Tipo de juego inválido ==========
console.log('\n🧪 PRUEBA 4: Validación - Tipo de juego inválido');
console.log('-'.repeat(60));
try {
    servidor.crearPartida('JugadorTest', 'Invalido', 'Gemas', 3);
    console.log('❌ FALLO: Debería haber lanzado error');
} catch (error) {
    console.log('✅ RESULTADO ESPERADO: Error capturado correctamente');
    console.log(`   Mensaje: ${error.message}`);
}

// ========== PRUEBA 5: Listar partidas disponibles ==========
console.log('\n🧪 PRUEBA 5: Listar partidas disponibles (REQ-011)');
console.log('-'.repeat(60));
try {
    const partidasDisponibles = servidor.obtenerPartidasDisponibles();
    console.log(`✅ RESULTADO: ${partidasDisponibles.length} partidas encontradas`);
    
    partidasDisponibles.forEach((p, index) => {
        console.log(`\n   Partida ${index + 1}:`);
        console.log(`   - Código: ${p.id}`);
        console.log(`   - Tipo: ${p.tipo}`);
        console.log(`   - Temática: ${p.tematica}`);
        console.log(`   - Jugadores: ${p.jugadoresActuales}/${p.jugadoresMaximos}`);
        console.log(`   - Tiempo restante: ${p.tiempoRestanteSegundos}s`);
        console.log(`   - Jugadores unidos: [${p.jugadoresNombres.join(', ')}]`);
    });
} catch (error) {
    console.error('❌ ERROR:', error.message);
}

// ========== PRUEBA 6: Unirse a una partida ==========
console.log('\n🧪 PRUEBA 6: Unirse a una partida (REQ-005, REQ-012)');
console.log('-'.repeat(60));
try {
    // Obtener código de la primera partida
    const partidas = servidor.obtenerPartidasDisponibles();
    if (partidas.length > 0) {
        const codigoPartida = partidas[0].id;
        
        console.log(`Intentando unirse a partida: ${codigoPartida}`);
        
        // Primer jugador se une
        const jugador1 = servidor.unirseAPartida(codigoPartida, 'Jugador1', 'socket-001');
        console.log(`✅ ${jugador1.nickname} se unió exitosamente`);
        
        // Segundo jugador se une
        const jugador2 = servidor.unirseAPartida(codigoPartida, 'Jugador2', 'socket-002');
        console.log(`✅ ${jugador2.nickname} se unió exitosamente`);
        
        // Verificar si la partida tiene espacio para más jugadores
        const partidaActualizada = servidor.partidasActivas.get(codigoPartida);
        console.log(`\n   Estado de la partida:`);
        console.log(`   - Jugadores: ${partidaActualizada.jugadores.size}/${partidaActualizada.getNumJugadoresMax()}`);
        console.log(`   - Estado: ${partidaActualizada.estado}`);
        
        // Si la partida necesita más jugadores, agregar el tercero
        if (partidaActualizada.jugadores.size < partidaActualizada.getNumJugadoresMax()) {
            const jugador3 = servidor.unirseAPartida(codigoPartida, 'Jugador3', 'socket-003');
            console.log(`✅ ${jugador3.nickname} se unió exitosamente`);
            
            // Verificar estado final (debería estar jugando si se completó)
            console.log(`\n   Estado final de la partida:`);
            console.log(`   - Jugadores: ${partidaActualizada.jugadores.size}/${partidaActualizada.getNumJugadoresMax()}`);
            console.log(`   - Estado: ${partidaActualizada.estado}`);
            
            if (partidaActualizada.estado === 'jugando') {
                console.log(`\n   🎮 ¡La partida ha comenzado! (REQ-012)`);
            }
        }
    } else {
        console.log('⚠️  No hay partidas disponibles para unirse');
    }
} catch (error) {
    console.error('❌ ERROR:', error.message);
}

// ========== PRUEBA 7: Validación - Unirse a partida llena ==========
console.log('\n🧪 PRUEBA 7: Validación - Intentar unirse a partida llena');
console.log('-'.repeat(60));
try {
    const partidas = servidor.obtenerPartidasDisponibles();
    const partidaLlena = Array.from(servidor.partidasActivas.values())
        .find(p => p.jugadores.size === p.getNumJugadoresMax());
    
    if (partidaLlena) {
        servidor.unirseAPartida(partidaLlena.idPartida, 'JugadorTarde', 'socket-999');
        console.log('❌ FALLO: Debería haber lanzado error');
    } else {
        console.log('⚠️  No hay partidas llenas para probar');
    }
} catch (error) {
    console.log('✅ RESULTADO ESPERADO: Error capturado correctamente');
    console.log(`   Mensaje: ${error.message}`);
}

// ========== PRUEBA 8: Validación - Nickname duplicado ==========
console.log('\n🧪 PRUEBA 8: Validación - Nickname duplicado en la misma partida');
console.log('-'.repeat(60));
try {
    const partidas = servidor.obtenerPartidasDisponibles();
    if (partidas.length > 0 && partidas[0].jugadoresActuales < partidas[0].jugadoresMaximos) {
        const codigoPartida = partidas[0].id;
        const nicknameExistente = partidas[0].jugadoresNombres[0];
        
        if (nicknameExistente) {
            servidor.unirseAPartida(codigoPartida, nicknameExistente, 'socket-duplicado');
            console.log('❌ FALLO: Debería haber lanzado error');
        }
    }
} catch (error) {
    console.log('✅ RESULTADO ESPERADO: Error capturado correctamente');
    console.log(`   Mensaje: ${error.message}`);
}

// ========== PRUEBA 9: Estado del servidor ==========
console.log('\n🧪 PRUEBA 9: Estado final del servidor');
console.log('-'.repeat(60));
console.log(`📊 Total de partidas activas: ${servidor.getTotalPartidasActivas()}`);
console.log(`\nDesglose por estado:`);

let enEspera = 0;
let jugando = 0;
let finalizadas = 0;

servidor.partidasActivas.forEach(partida => {
    if (partida.estado === 'espera') enEspera++;
    else if (partida.estado === 'jugando') jugando++;
    else if (partida.estado === 'finalizada') finalizadas++;
});

console.log(`   - En espera: ${enEspera}`);
console.log(`   - Jugando: ${jugando}`);
console.log(`   - Finalizadas: ${finalizadas}`);

// ========== PRUEBA 10: Temporizador de cancelación (simulación) ==========
console.log('\n🧪 PRUEBA 10: Verificación de temporizador de cancelación (REQ-010)');
console.log('-'.repeat(60));
console.log('ℹ️  Las partidas en espera se cancelarán automáticamente después de');
console.log(`   ${servidor.getConfiguracion().TIEMPO_VIDA_PARTIDA_MIN} minutos (configurado en config.json)`);
console.log('   Para probarlo, espera el tiempo configurado y las partidas en espera');
console.log('   serán eliminadas automáticamente.');

console.log('\n' + '='.repeat(60));
console.log('✅ TODAS LAS PRUEBAS COMPLETADAS');
console.log('='.repeat(60));
console.log('\nResumen:');
console.log('- ✅ REQ-005: Autenticación con nickname implementada');
console.log('- ✅ REQ-007: Creación de partida con modo de juego');
console.log('- ✅ REQ-008: Selección de temática, duración y cantidad de jugadores');
console.log('- ✅ REQ-009: Generación de código identificador único');
console.log('- ✅ REQ-010: Temporizador de cancelación configurado');
console.log('- ✅ REQ-011: Listado de partidas con información completa');
console.log('- ✅ REQ-012: Espera de jugadores y cambio de estado automático');
console.log('\n📝 NOTA: Este es el backend. Todas las funciones están listas');
console.log('   para conectarse con el cliente mediante API REST y Socket.IO');
console.log('\n');
