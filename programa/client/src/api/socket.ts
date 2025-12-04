/**
 * @file socket.ts
 * @description Módulo de inicialización y gestión de conexión Socket.IO (versión legacy).
 * 
 * NOTA: Este módulo está deprecado. La aplicación actual usa `SocketService.ts`
 * y el contexto `AuthContext` para gestionar la conexión del socket.
 * 
 * Provee funciones para:
 * - Inicializar la conexión global del socket.
 * - Obtener la instancia activa.
 * - Desconectar manualmente.
 */

import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

let socket: Socket | null = null;

/**
 * Inicializa la conexión Socket.IO al servidor.
 * Si ya existe una conexión activa, la reutiliza.
 * @returns Instancia del socket conectado.
 */
export const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('[SOCKET] Conectado al servidor:', socket?.id);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('[SOCKET] Desconectado:', reason);
    });

    socket.on('error', (error: any) => {
      console.error('[SOCKET] Error:', error);
    });
  }

  return socket;
};

/**
 * Obtiene la instancia actual del socket.
 * @returns Socket activo o null si no se ha inicializado.
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Desconecta manualmente el socket y limpia la referencia.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[SOCKET] Desconectado manualmente');
  }
};
