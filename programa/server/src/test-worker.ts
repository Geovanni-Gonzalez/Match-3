
import { WorkerThreadUtility } from './core/workers/workerUtility.js';
import { Celda } from './core/domain/Celda.js';
import { Coordenada } from './interfaces.js';

async function testWorker() {
    console.log("--- Iniciando prueba de Worker Thread ---");

    // 1. Crear un tablero simulado (3x3)
    // Fila 0: R R R (Rojo) -> Match Válido
    // Fila 1: A A A (Azul)
    // Fila 2: R A R (Mezclado)
    const tablero: Celda[][] = [];
    for(let r=0; r<3; r++) {
        const row: Celda[] = [];
        for(let c=0; c<3; c++) {
            // Mock de colores válidos
            const celda = new Celda(r, c, ['R', 'A']);
            // Forzamos colores
            if (r === 0) celda.asignarColor('R'); 
            else if (r === 1) celda.asignarColor('A'); 
            else celda.asignarColor(c === 1 ? 'A' : 'R');
            row.push(celda);
        }
        tablero.push(row);
    }

    // CASO 1: Match Válido (Horizontal Fila 0)
    const matchValido: Coordenada[] = [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 }
    ];

    console.log("\n1. Probando Match Válido (R-R-R)...");
    try {
        const resultado = await WorkerThreadUtility.validarCadena(matchValido, tablero);
        if (resultado.valido && resultado.n === 3) {
            console.log("✅ PASÓ: El worker validó correctamente el match.");
        } else {
            console.error("❌ FALLÓ: El worker rechazó un match válido.", resultado);
        }
    } catch (error) {
        console.error("❌ ERROR CRÍTICO en Worker (Válido):", error);
    }

    // CASO 2: Match Inválido (Colores mezclados Vertical Col 0: R-A-R)
    const matchInvalido: Coordenada[] = [
        { r: 0, c: 0 },
        { r: 1, c: 0 },
        { r: 2, c: 0 }
    ];

    console.log("\n2. Probando Match Inválido (Color mezclado)...");
    try {
        const resultado2 = await WorkerThreadUtility.validarCadena(matchInvalido, tablero);
        if (!resultado2.valido) {
            console.log("✅ PASÓ: El worker rechazó correctamente el match inválido.");
        } else {
            console.error("❌ FALLÓ: El worker aceptó un match inválido.", resultado2);
        }
    } catch (error) {
        console.error("❌ ERROR CRÍTICO en Worker (Inválido):", error);
    }
    
    console.log("\n--- Fin de la prueba ---");
    process.exit(0);
}

testWorker();
