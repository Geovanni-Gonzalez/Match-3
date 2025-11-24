export class GameManager {
    private static instance: GameManager;
    private partidas: Map<string, any>;

    private constructor() {
        this.partidas = new Map();
    }

    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    public crearPartida(maxJugadores: number) {
        const id = Math.random().toString(36).substring(2, 9).toUpperCase();
        const nuevaPartida = {
            id,
            maxJugadores,
            jugadores: [],
            estado: 'esperando'
        };
        this.partidas.set(id, nuevaPartida);
        return nuevaPartida;
    }

    public obtenerPartida(id: string) {
        return this.partidas.get(id);
    }

    public listarPartidasDisponibles() {
        return Array.from(this.partidas.values()).filter(
            partida => partida.estado === 'esperando'
        );
    }
}
