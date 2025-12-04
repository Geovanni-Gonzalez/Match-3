/**
 * @file workerUtility.ts
 * @description Utilidad para gestionar hilos de trabajo (Worker Threads) en el servidor.
 * Permite ejecutar tareas intensivas, como la validación de matches, en un hilo separado
 * para no bloquear el Event Loop principal de Node.js.
 */
import { Worker } from 'worker_threads';
import { Coordenada } from '../../interfaces.js';
import { Celda } from '../domain/Celda.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Clase utilitaria para la creación y gestión de Worker Threads.
 */
export class WorkerThreadUtility {

    /**
     * Valida una cadena de celdas utilizando un Worker Thread.
     * Esto evita bloquear el hilo principal durante cálculos complejos de validación.
     * 
     * @param celdas Lista de coordenadas seleccionadas por el jugador.
     * @param tablero Matriz actual del tablero de juego.
     * @returns Promesa que resuelve con el resultado de la validación (validez, cantidad, celdas).
     */
    public static async validarCadena(celdas: Coordenada[], tablero: Celda[][]): Promise<{ valido: boolean, n: number, celdas: Coordenada[] }> {
        return new Promise((resolve, reject) => {
            const isTs = __filename.endsWith('.ts');
            const workerFile = isTs ? './matchWorker.ts' : './matchWorker.js';
            const workerPath = path.join(__dirname, workerFile);

            const workerOptions: any = {};
            if (isTs) {
                 // Para desarrollo con ts-node/esm
                 workerOptions.execArgv = ["--loader", "ts-node/esm", "--no-warnings"];
            }

            const worker = new Worker(workerPath, workerOptions);

            // Simplificar el tablero para enviarlo al worker (solo datos, sin métodos)
            const tableroSimple = tablero.map(row => row.map(c => ({
                r: c.fila,
                c: c.columna,
                colorID: c.colorID
            })));

            worker.postMessage({ listaCeldas: celdas, matrizTablero: tableroSimple });

            worker.on('message', (result) => {
                resolve(result);
                worker.terminate();
            });

            worker.on('error', (err) => {
                console.error("Worker error:", err);
                reject(err);
                worker.terminate();
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }
}