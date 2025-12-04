// client/src/context/AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';

// --- 1. INTERFACES DE TIPOS ---

export interface UserSession {
    nickname: string;
    socketID: string;
    idDB: number; 
}

interface AuthContextType {
    currentUser: UserSession | null;
    isAuthenticated: boolean;
    socket: Socket | null; // Agregamos el socket al contexto para usarlo en otras vistas
    login: (nickname: string, idDB: number) => Promise<void>;
    logout: () => void;
}

// --- 2. CREACIÓN DEL CONTEXTO ---

// Definimos el contexto con un valor inicial nulo y tipado
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 3. COMPONENTE PROVEEDOR ---

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const isAuthenticated = currentUser !== null;

    const login = async (nickname: string, idDB: number) => {
        return new Promise<void>((resolve, reject) => {
            // Conectamos al servidor real en el puerto 4000
            // "ngrok-skip-browser-warning" evita la página de advertencia de Ngrok que rompe el socket
            const newSocket = io(API_URL, {
                extraHeaders: {
                    "ngrok-skip-browser-warning": "true"
                }
            });

            newSocket.on('connect', () => {
                console.log(`[Auth] Conectado al servidor con ID: ${newSocket.id}`);
                
                // Guardamos el socket y el usuario en el estado
                setSocket(newSocket);
                setCurrentUser({ nickname, socketID: newSocket.id || '' , idDB}); 
                resolve();
            });

            newSocket.on('connect_error', (err) => {
                console.error('[Auth] Error de conexión con el servidor:', err);
                reject(new Error('No se pudo conectar al servidor de juego.'));
            });
        });
    };

    const logout = () => {
        if (socket) {
            socket.disconnect(); // Desconectamos el socket al salir
            console.log('[Auth] Socket desconectado.');
        }
        setSocket(null);
        setCurrentUser(null);
    };

    const contextValue: AuthContextType = {
        currentUser,
        isAuthenticated,
        socket,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// --- 4. CUSTOM HOOK PARA CONSUMIR EL CONTEXTO ---

/**
 * Hook personalizado para acceder de forma sencilla al estado de autenticación.
 * @returns {AuthContextType}
 * @throws {Error} Si no se usa dentro de un AuthProvider.
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

