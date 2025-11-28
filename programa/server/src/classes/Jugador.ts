// server/src/classes/Jugador.ts
import { Coordenada } from '../interfaces';

export class Jugador {
    public puntaje: number = 0;
    public celdasSeleccionadas: Coordenada[] = [];
    public isReady: boolean = false; // Propiedad añadida para gestionar el estado de "listo" (REQ-022)

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

    public calcularPuntaje(n: number): void {
        const puntajeAdicional = Math.pow(n, 2); // REQ-027
        this.puntaje += puntajeAdicional;
    }

    public obtenerInfoBasica() {
    return {
        nickname: this.nickname,
        idDB: this.idDB,
        socketID: this.socketID,
        puntaje: this.puntaje,
        celdasSeleccionadas: this.celdasSeleccionadas,
        };
    }
}