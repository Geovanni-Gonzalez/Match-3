
import io from 'socket.io-client';
export const socket = io.connect('http://localhost:4000');


export const registerPlayer = (nickname) => {
    socket.emit('registrarJugador', { nickname });
};

socket.on('registroExitoso', (data) => {
    console.log(data.message);
});

socket.on('registroError', (data) => {
    console.error(data.message);
});

export default socket;