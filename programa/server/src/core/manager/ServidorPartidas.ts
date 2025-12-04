// server/src/core/manager/ServidorPartidas.ts
import { Partida } from '../domain/Partida.js';
import { Jugador } from '../domain/Jugador.js';
import config from '../../config/config.js';


export class ServidorPartidas {
private static instance: ServidorPartidas;
public partidasActivas: Map<string, Partida> = new Map();


private constructor() {}


public static getInstance() {
if (!ServidorPartidas.instance) ServidorPartidas.instance = new ServidorPartidas();
return ServidorPartidas.instance;
}


public crearPartida(id: string, tipo: 'Match' | 'Tiempo', tematica: string, max: number, duracion?: number) {
const p = new Partida(id, tipo, tematica, max, undefined, undefined, undefined, duracion);
this.partidasActivas.set(id, p);
return p;
}


public obtenerPartida(id: string) {
return this.partidasActivas.get(id);
}


public eliminarPartida(id: string) {
this.partidasActivas.delete(id);
}
}