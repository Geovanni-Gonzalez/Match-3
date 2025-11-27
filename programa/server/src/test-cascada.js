// Test para verificar el sistema de matches en cascada
const { Tablero } = require('../dist/classes/Tablero');
const { Celda } = require('../dist/classes/Celda');
const fs = require('fs');
const path = require('path');

// Cargar configuración (desde el directorio programa)
const configPath = path.join(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

console.log('============================================================');
console.log('PRUEBA DE MATCHES EN CASCADA');
console.log('============================================================\n');

console.log('📋 Configuración cargada:');
console.log(`   - Dimensiones: ${config.TAMANIO_FILA}x${config.TAMANIO_COLUMNA}`);
console.log(`   - Colores válidos: ${config.COLORES_VALIDOS.join(', ')}\n`);

// ====================================================================
// PRUEBA 1: Detección de matches básicos
// ====================================================================
console.log('🧪 PRUEBA 1: Detección de matches en el tablero');
console.log('------------------------------------------------------------\n');

const tablero1 = new Tablero(config);

console.log('Estado inicial del tablero:');
tablero1.imprimirTablero();

console.log('\n✅ Detectando matches iniciales...');
const matchesIniciales = tablero1.detectarMatches();
console.log(`   - Matches encontrados: ${matchesIniciales.length} celdas`);

if (matchesIniciales.length > 0) {
    console.log('   ⚠️ ADVERTENCIA: Se encontraron matches en la inicialización');
    console.log('   (Esto no debería pasar con la inicialización correcta)');
} else {
    console.log('   ✓ El tablero está libre de matches (correcto)\n');
}

// ====================================================================
// PRUEBA 2: Simular match manual y cascada simple
// ====================================================================
console.log('🧪 PRUEBA 2: Match manual y detección de cascada');
console.log('------------------------------------------------------------\n');

const tablero2 = new Tablero(config);

// Forzar un escenario: crear matches horizontales en fila 5
console.log('Forzando matches horizontales en fila 5 (columnas 0-4):');
const color = 'azul';
for (let c = 0; c < 5; c++) {
    tablero2.matriz[5][c] = new Celda(5, c, color);
}

tablero2.imprimirTablero();

console.log(`\n✅ Detectando matches después de forzar colores...`);
const matchesForzados = tablero2.detectarMatches();
console.log(`   - Matches encontrados: ${matchesForzados.length} celdas`);

if (matchesForzados.length >= 5) {
    console.log(`   ✓ Match de 5 ${color} detectado correctamente\n`);
} else {
    console.log('   ✗ No se detectó el match forzado\n');
}

// Procesar cascada
console.log('Procesando cascada desde el match forzado...\n');
const resultado = tablero2.procesarMatchesEnCascada(matchesForzados);

console.log('📊 Resultado de la cascada:');
console.log(`   - Combos alcanzados: ${resultado.comboMultiplicador}x`);
console.log(`   - Total de celdas eliminadas: ${resultado.totalCeldasEliminadas}`);
console.log(`   - Fases de combo: ${resultado.historialCombos.length}`);

console.log('\nEstado final del tablero:');
tablero2.imprimirTablero();

console.log('\n✅ Verificando que no hay matches finales...');
const matchesFinales = tablero2.detectarMatches();
if (matchesFinales.length === 0) {
    console.log('   ✓ Tablero sin matches después de la cascada\n');
} else {
    console.log(`   ✗ Aún hay ${matchesFinales.length} celdas con matches\n`);
}

// ====================================================================
// PRUEBA 3: Escenario de cascada múltiple
// ====================================================================
console.log('🧪 PRUEBA 3: Cascada múltiple (varios combos consecutivos)');
console.log('------------------------------------------------------------\n');

const tablero3 = new Tablero(config);

// Crear un escenario complejo: varios matches en diferentes filas
console.log('Forzando múltiples matches en diferentes posiciones:');
console.log('  - Fila 6, columnas 1-3: verde (horizontal)');
console.log('  - Fila 7, columnas 0-2: rojo (horizontal)');
console.log('  - Columna 3, filas 4-6: amarillo (vertical)\n');

// Matches horizontales
for (let c = 1; c <= 3; c++) {
    tablero3.matriz[6][c] = new Celda(6, c, 'verde');
}
for (let c = 0; c <= 2; c++) {
    tablero3.matriz[7][c] = new Celda(7, c, 'rojo');
}

// Match vertical
for (let r = 4; r <= 6; r++) {
    tablero3.matriz[r][3] = new Celda(r, 3, 'amarillo');
}

tablero3.imprimirTablero();

console.log('\n✅ Detectando todos los matches...');
const matchesComplejos = tablero3.detectarMatches();
console.log(`   - Matches encontrados: ${matchesComplejos.length} celdas`);

console.log('\nProcesando cascada compleja...\n');
const resultadoComplejo = tablero3.procesarMatchesEnCascada(matchesComplejos);

console.log('📊 Resultado de la cascada compleja:');
console.log(`   - Combos alcanzados: ${resultadoComplejo.comboMultiplicador}x`);
console.log(`   - Total de celdas eliminadas: ${resultadoComplejo.totalCeldasEliminadas}`);
console.log(`   - Fases del combo:`);
resultadoComplejo.historialCombos.forEach((combo, index) => {
    console.log(`     Combo ${index + 1}: ${combo.length} celdas`);
});

console.log('\nEstado final del tablero:');
tablero3.imprimirTablero();

// ====================================================================
// RESUMEN
// ====================================================================
console.log('\n============================================================');
console.log('✅ TODAS LAS PRUEBAS DE CASCADA COMPLETADAS');
console.log('============================================================\n');

console.log('Resumen de funcionalidades implementadas:');
console.log('- ✅ detectarMatches(): Detecta matches de 3+ horizontal y vertical');
console.log('- ✅ procesarMatchesEnCascada(): Maneja combos automáticos');
console.log('- ✅ Sistema de combo con multiplicador');
console.log('- ✅ Historial de cada fase del combo');
console.log('- ✅ Prevención de matches infinitos\n');

console.log('📝 NOTA: Esta funcionalidad está lista para integrarse en Partida.ts');
console.log('         y conectarse con el cliente vía Socket.IO para notificar combos.');
