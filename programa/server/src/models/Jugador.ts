export class Jugador {
    public id: string;       // ID del socket
    public nickname: string;
    public puntaje: number;
    public isReady: boolean;

    constructor(id: string, nickname: string) {
        this.id = id;
        this.nickname = nickname;
        this.puntaje = 0; // REQ-029: Puntaje inicial
        this.isReady = false;
    }
}