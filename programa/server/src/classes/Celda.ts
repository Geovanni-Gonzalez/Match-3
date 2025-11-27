// server/src/classes/Celda.ts

import { Coordenada } from '../interfaces';

export class Celda {
    public colorID: string;
    public estado: 'libre' | 'seleccion_propia' | 'seleccion_otro';

    /**
     * Constructor de Celda
     * @param fila - Posición en fila
     * @param columna - Posición en columna
     * @param colorOColores - Si es string, usa ese color. Si es array, genera uno aleatorio
     */
    constructor(
        public fila: number,
        public columna: number,
        colorOColores: string | string[]
    ) {
        if (typeof colorOColores === 'string') {
            // Color específico proporcionado
            this.colorID = colorOColores;
        } else {
            // Array de colores: generar uno aleatorio
            this.colorID = this.generarColorAleatorio(colorOColores);
        }
        this.estado = 'libre';
    }

    private generarColorAleatorio(coloresValidos: string[]): string {
        const index = Math.floor(Math.random() * coloresValidos.length);
        return coloresValidos[index];
    }

    public asignarColor(nuevoColor: string): void {
        this.colorID = nuevoColor;
    }

    public establecerEstado(nuevoEstado: 'libre' | 'seleccion_propia' | 'seleccion_otro'): void {
        this.estado = nuevoEstado;
    }

    public obtenerCoordenadas(): Coordenada {
        return { r: this.fila, c: this.columna };
    }
}