// client/src/api/socket.ts
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

let socket: Socket | null = null;

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

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[SOCKET] Desconectado manualmente');
  }
};
