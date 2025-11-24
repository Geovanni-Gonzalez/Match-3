// server/src/classes/Tablero.ts

import { Celda } from './Celda';
import { Configuracion, Coordenada } from '../interfaces';

export class Tablero {
    public matriz: Celda[][] = [];
    private config: Configuracion;

    constructor(config: Configuracion) {
        this.config = config;
        this.inicializar();
    }

    private inicializar(): void {
        const { TAMANIO_FILA: R, TAMANIO_COLUMNA: C, COLORES_VALIDOS } = this.config;
        for (let r = 0; r < R; r++) {
            this.matriz[r] = [];
            for (let c = 0; c < C; c++) {
                this.matriz[r][c] = new Celda(r, c, COLORES_VALIDOS);
            }
        }
    }

    public obtenerCelda(r: number, c: number): Celda | undefined {
        // Verifica límites
        if (r >= 0 && r < this.config.TAMANIO_FILA && c >= 0 && c < this.config.TAMANIO_COLUMNA) {
            return this.matriz[r][c];
        }
        return undefined;
    }

    public actualizarCeldas(listaCeldas: Coordenada[]): void {
        // REQ-026: Relleno automático con nuevos colores aleatorios
        const { COLORES_VALIDOS } = this.config;
        for (const { r, c } of listaCeldas) {
            const nuevaCelda = new Celda(r, c, COLORES_VALIDOS);
            this.matriz[r][c] = nuevaCelda;
            nuevaCelda.establecerEstado('libre');
        }
    }
}