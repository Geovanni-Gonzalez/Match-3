// server/src/core/domain/Tablero.ts
import { Celda } from './Celda';
import config from '../../config/config';
import { Coordenada } from '../../interfaces';


export class Tablero {
    public matriz: Celda[][] = [];


    constructor() {
    this.inicializar();
    }


    private inicializar() {
        const R = config.TAMANIO_FILA;
        const C = config.TAMANIO_COLUMNA;
        const colores = config.COLORES_VALIDOS;


        for (let r = 0; r < R; r++) {
            this.matriz[r] = [];
            for (let c = 0; c < C; c++) {
            this.matriz[r][c] = new Celda(r, c, colores);
            }
        }
    }


    public obtenerCelda(r: number, c: number) {
        if (r < 0 || c < 0) return undefined;
        if (!this.matriz[r] || !this.matriz[r][c]) return undefined;
        return this.matriz[r][c];
    }


    public actualizarCeldas(lista: Coordenada[]) {
    const colores = config.COLORES_VALIDOS;
        for (const { r, c } of lista) {
            this.matriz[r][c] = new Celda(r, c, colores);
        }
    }
}