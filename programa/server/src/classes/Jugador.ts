// server/src/classes/Jugador.ts

import { Coordenada } from '../interfaces';
import { DBManager } from '../db/dbManager';

export class Jugador {
    public puntaje: number = 0;
    public celdasSeleccionadas: Coordenada[] = [];

    constructor(
        public nickname: string,
        public idDB: number, 
        public socketID: string
    ) {}

    public agregarCelda(r: number, c: number): void {
        const coord: Coordenada = { r, c };
        const index = this.celdasSeleccionadas.findIndex(
            (sel) => sel.r === r && sel.c === c
        );

        if (index > -1) {
            // Elimina si ya está seleccionada (toggle)
            this.celdasSeleccionadas.splice(index, 1);
        } else {
            // Agrega
            this.celdasSeleccionadas.push(coord);
        }
    }

    public limpiarSelecciones(): void {
        this.celdasSeleccionadas = [];
    }

    /**
     * calcularPuntaje - Suma puntos usando fórmula n² (REQ-027)
     * @param n - Cantidad de celdas en el match
     * Ejemplo: 3 celdas = 9 puntos, 4 celdas = 16 puntos, 5 celdas = 25 puntos
     */
    public calcularPuntaje(n: number): void {
        const puntajeAdicional = Math.pow(n, 2); // n²
        this.puntaje += puntajeAdicional;
        console.log(`[JUGADOR ${this.nickname}] +${puntajeAdicional} puntos (${n} celdas) | Total: ${this.puntaje}`);
    }

    public async guardarEstadisticas(partidaId: string, esGanador: boolean): Promise<void> {
        await DBManager.guardarEstadisticas(partidaId, this.idDB, this.puntaje, esGanador);
    }
}