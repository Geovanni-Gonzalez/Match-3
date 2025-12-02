// server/src/core/manager/ServidorPartidas.ts
import { Partida } from '../domain/Partida';
import { Jugador } from '../domain/Jugador';
import config from '../../config/config';


export class ServidorPartidas {
private static instance: ServidorPartidas;
public partidasActivas: Map<string, Partida> = new Map();


private constructor() {}


public static getInstance() {
if (!ServidorPartidas.instance) ServidorPartidas.instance = new ServidorPartidas();
return ServidorPartidas.instance;
}


public crearPartida(id: string, tipo: 'Match' | 'Tiempo', tematica: string, max: number) {
const p = new Partida(id, tipo, tematica, max);
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