import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext'; // Importamos el socket del AuthContext
import { SocketService } from '../services/SocketService';
// Tipos
interface TableroData { /* ... */ } 
interface JugadorData { /* ... */ }

/**
 * Hook personalizado para manejar el estado de la partida y las interacciones
 * a través del SocketService.
 */
export const useGameEvents = () => {
    // Obtenemos el socket de la sesión del usuario
    const { socket } = useAuth(); 
    
    // Estados que reflejan la información recibida del servidor
    const [tablero, setTablero] = useState<TableroData | null>(null);
    const [jugadores, setJugadores] = useState<JugadorData[]>([]);
    const [gameStatus, setGameStatus] = useState<'loading' | 'active' | 'finished'>('loading');


    // Inicializamos el repositorio una sola vez con la instancia del socket
    const socketService = useMemo(() => {
        if (socket) {
            return new SocketService(socket);
        }
        return null;
    }, [socket]); // Se recrea solo si la instancia del socket cambia

    // =======================================================
    // 1. GESTIÓN DE LISTENERS (El núcleo del hook)
    // =======================================================
    useEffect(() => {
        if (!socketService) return; // Solo suscribirse si el repositorio está listo

        // 1. Suscripción a la actualización del tablero
        const unsubscribeBoard = socketService.onBoardUpdate((data) => {
            setTablero(data);
            setGameStatus('active');
        });

        // 2. Suscripción a la actualización de jugadores
        const unsubscribePlayers = socketService.onPlayersUpdate((players) => {
            setJugadores(players);
        });

        // FUNCIÓN DE LIMPIEZA: CRUCIAL para evitar fugas de memoria
        return () => {
            console.log("[useGameEvents] Limpiando listeners.");
            unsubscribeBoard();
            unsubscribePlayers();
        };
    }, [socketService]); // Se ejecuta cuando el socketService (y por ende el socket) está listo

    // =======================================================
    // 2. RETORNO DE DATOS Y FUNCIONES (Para el Componente)
    // =======================================================

    return {
        // Datos reactivos del servidor
        tablero,
        jugadores,
        gameStatus,

        // Funciones de acción (emitidas por el repositorio)
        joinGame: socketService?.joinGame.bind(socketService), // bind(socketService) mantiene el contexto 'this'
        sendMove: socketService?.sendMove.bind(socketService),
        setReady: socketService?.setReady.bind(socketService),
        createGame: socketService?.createGame.bind(socketService),
        onGameCreated: socketService?.onGameCreated.bind(socketService),
    };
};