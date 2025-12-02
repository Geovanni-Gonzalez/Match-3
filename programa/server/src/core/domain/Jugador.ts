// server/src/core/domain/Jugador.ts
import { Coordenada } from '../../interfaces';


export class Jugador {
    public puntaje = 0;
    public celdasSeleccionadas: Coordenada[] = [];
    public isReady = false;
    public conectado = true;


    constructor(
        public nickname: string,
        public idDB: number,
        public socketID: string
    ) {socketID; }


    public agregarCelda(r: number, c: number) {
        const idx = this.celdasSeleccionadas.findIndex(s => s.r === r && s.c === c);
        if (idx > -1) this.celdasSeleccionadas.splice(idx, 1);
        else this.celdasSeleccionadas.push({ r, c });
    }


    public limpiarSelecciones() {
        this.celdasSeleccionadas = [];
    }


    public calcularPuntaje(n: number) {
        this.puntaje += Math.pow(n, 2);
    }


    public obtenerInfoBasica() {
        return {
            nickname: this.nickname,
            idDB: this.idDB,
            socketID: this.socketID,
            puntaje: this.puntaje
        };
    }
}