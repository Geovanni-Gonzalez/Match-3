import { Coordenada } from '../../interfaces.js';
import { Celda } from '../domain/Celda.js';

export class WorkerThreadUtility {

    // Lógica CRÍTICA que se ejecuta en el Worker Thread para validar la cadena de celdas
    public static ejecutarValidacionEnWorker(listaCeldas: Coordenada[], matrizTablero: Celda[][]): { valido: boolean, n: number, celdas: Coordenada[] } {
        const n = listaCeldas.length;

        // Regla 1: Tamaño Mínimo (n >= 3)
        if (n < 3) {
            return { valido: false, n: 0, celdas: [] };
        }

        // Obtener el color objetivo de la primera celda
        const { r: r0, c: c0 } = listaCeldas[0];
        const celdaInicial = matrizTablero[r0]?.[c0];
        if (!celdaInicial) return { valido: false, n: 0, celdas: [] };
        
        const colorObjetivo = celdaInicial.colorID;

        // Regla 2: Uniformidad de Color
        for (let i = 1; i < n; i++) {
            const { r, c } = listaCeldas[i];
            const celdaActual = matrizTablero[r]?.[c];
            
            if (!celdaActual || celdaActual.colorID !== colorObjetivo) {
                return { valido: false, n: 0, celdas: [] };
            }
        }

        // -----------------------------------------------------
        // Regla 3: Adyacencia (H, V, o D) y Prohibición de Repetición
        // -----------------------------------------------------
        const celdasVistas = new Set<string>();
        celdasVistas.add(`${listaCeldas[0].r},${listaCeldas[0].c}`);

        for (let i = 1; i < n; i++) {
            const celdaAnterior = listaCeldas[i - 1];
            const celdaActual = listaCeldas[i];
            
            // 3a. Prohibición de Repetición (no se puede seleccionar la misma celda dos veces)
            const claveActual = `${celdaActual.r},${celdaActual.c}`;
            if (celdasVistas.has(claveActual)) {
                 return { valido: false, n: 0, celdas: [] }; // Celda repetida
            }
            celdasVistas.add(claveActual);

            // 3b. Adyacencia (Horizontal, Vertical o Diagonal)
            const deltaR = Math.abs(celdaActual.r - celdaAnterior.r);
            const deltaC = Math.abs(celdaActual.c - celdaAnterior.c);

            // Adyacencia General (8 direcciones): deltaR y deltaC deben ser <= 1
            // Y no deben ser la misma celda (ya cubierto por 3a, pero el chequeo es (dr > 0 o dc > 0))
            const esAdyacenteTotal = (deltaR <= 1 && deltaC <= 1) && (deltaR > 0 || deltaC > 0);

            if (!esAdyacenteTotal) {
                return { valido: false, n: 0, celdas: [] }; // Falla la regla de encadenamiento
            }
        }

        return { valido: true, n: n, celdas: listaCeldas }; // ¡Match válido!
    }

    // Método que simula la interacción asíncrona del Main Thread (sin cambios)
    public static async validarCadena(celdas: Coordenada[], tablero: Celda[][]): Promise<{ valido: boolean, n: number, celdas: Coordenada[] }> {
        // En la implementación real, esto usaría new Worker()
        // Aquí simulamos la espera asíncrona:
        return WorkerThreadUtility.ejecutarValidacionEnWorker(celdas, tablero);
    }
}