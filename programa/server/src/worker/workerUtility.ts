// server/src/worker/workerUtility.ts

import { Coordenada } from '../Interfaces';
import { Celda } from '../classes/Celda'; // Necesita importar Celda para la tipificación de la matriz

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
        const colorObjetivo = matrizTablero[r0][c0].colorID;

        // Regla 2: Uniformidad de Color
        for (let i = 1; i < n; i++) {
            const { r, c } = listaCeldas[i];
            const celdaActual = matrizTablero[r][c];
            if (celdaActual.colorID !== colorObjetivo) {
                return { valido: false, n: 0, celdas: [] };
            }
        }

        // Regla 3: Adyacencia Total (V, H o D) - REQ-024
        for (let i = 1; i < n; i++) {
            const celdaAnterior = listaCeldas[i - 1];
            const celdaActual = listaCeldas[i];

            const deltaR = Math.abs(celdaActual.r - celdaAnterior.r);
            const deltaC = Math.abs(celdaActual.c - celdaAnterior.c);

            // Adyacencia: Delta en R y C debe ser <= 1 Y no deben ser la misma celda
            if (deltaR > 1 || deltaC > 1 || (deltaR === 0 && deltaC === 0)) {
                return { valido: false, n: 0, celdas: [] };
            }
        }

        return { valido: true, n: n, celdas: listaCeldas }; // ¡Match válido!
    }

    // Método que simula la interacción asíncrona del Main Thread
    public static async validarCadena(celdas: Coordenada[], tablero: Celda[][]): Promise<{ valido: boolean, n: number, celdas: Coordenada[] }> {
        // En la implementación real, esto usaría new Worker()
        // Aquí simulamos la espera asíncrona:
        return WorkerThreadUtility.ejecutarValidacionEnWorker(celdas, tablero);
    }
}