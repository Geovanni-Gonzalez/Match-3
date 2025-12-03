//  server/src/core/domain/Celda.ts
import { Coordenada } from '../../interfaces.js';

export class Celda {
    public colorID: string;
    public estado: 'libre' | 'seleccion_propia' | 'seleccion_otro' | 'bloqueada' = 'libre';
    public seleccionadoPor: string | null = null;


    constructor(
    public fila: number,
    public columna: number,
    coloresValidos: string[]
    ) {
        this.colorID = this.generarColorAleatorio(coloresValidos);
        this.estado = 'libre';
    }


    private generarColorAleatorio(coloresValidos: string[]): string {
    const index = Math.floor(Math.random() * coloresValidos.length);
    return coloresValidos[index];
    }


    public asignarColor(nuevoColor: string): void {
    this.colorID = nuevoColor;
    }


    public establecerEstado(nuevoEstado: 'libre' | 'seleccion_propia' | 'seleccion_otro' | 'bloqueada') {
    this.estado = nuevoEstado;
    }


    public obtenerCoordenadas(): Coordenada {
    return { r: this.fila, c: this.columna };
    }
}