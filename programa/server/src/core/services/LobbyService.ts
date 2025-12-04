/**
 * @file LobbyService.ts
 * @description Servicio auxiliar para operaciones relacionadas con el Lobby.
 * 
 * Actualmente proporciona una vista simplificada de las partidas activas.
 * Nota: La lógica principal de listado para el cliente suele residir en GameService
 * para incluir metadatos adicionales (tiempos, jugadores, etc.).
 */

import { ServidorPartidas } from '../manager/ServidorPartidas.js';

export class LobbyService {
    private servidor = ServidorPartidas.getInstance();

    /**
     * Obtiene la lista de todas las partidas que se encuentran en estado de espera.
     * @returns Array de instancias de Partida en espera.
     */
    public listarPartidasDisponibles() {
        return Array.from(this.servidor.partidasActivas.values()).filter(p => p.estado === 'espera');
    }
}