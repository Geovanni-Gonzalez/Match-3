import { io } from 'socket.io-client';

// Conectamos al puerto 4000 donde está tu servidor
export const socket = io('http://localhost:4000', {
    autoConnect: true
});