// server/src/core/services/LobbyService.ts
import { ServidorPartidas } from '../manager/ServidorPartidas.js';


export class LobbyService {
private servidor = ServidorPartidas.getInstance();


public listarPartidasDisponibles() {
return Array.from(this.servidor.partidasActivas.values()).filter(p => p.estado === 'espera');
}
}