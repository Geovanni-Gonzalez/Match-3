// client/src/context/AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { initializeSocket, disconnectSocket, getSocket } from '../api/socket';

// --- 1. INTERFACES DE TIPOS ---

export interface UserSession {
    nickname: string;
    socketID: string;
    // Puedes agregar más datos aquí: idDB, token de sesión, etc.
}

interface AuthContextType {
    currentUser: UserSession | null;
    isAuthenticated: boolean;
    login: (nickname: string) => Promise<void>;
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
    const isAuthenticated = currentUser !== null;

    // Función que maneja la lógica de autenticación
    const login = async (nickname: string) => {
        // Inicializar conexión Socket.IO en segundo plano
        const socket = initializeSocket();
        
        // Generar un socketID temporal inmediatamente
        const tempSocketID = 'temp-' + Math.random().toString(36).substring(7);
        setCurrentUser({ nickname, socketID: tempSocketID });
        console.log(`[AUTH] Usuario ${nickname} autenticado (Socket conectando...)`);
        
        // Actualizar el socketID cuando el socket se conecte
        socket.on('connect', () => {
            const realSocketID = socket.id || tempSocketID;
            setCurrentUser({ nickname, socketID: realSocketID });
            console.log(`[AUTH] Socket conectado. ID real: ${realSocketID}`);
        });
        
        // Si ya está conectado, actualizar inmediatamente
        if (socket.connected && socket.id) {
            setCurrentUser({ nickname, socketID: socket.id });
            console.log(`[AUTH] Socket ya conectado. ID: ${socket.id}`);
        }
        
        return Promise.resolve();
    };

    const logout = () => {
        // Aquí se limpiaría la sesión del usuario (localStorage, cookies, etc.)
        disconnectSocket();
        setCurrentUser(null);
        console.log('[AUTH] Sesión cerrada.');
    };

    const contextValue: AuthContextType = {
        currentUser,
        isAuthenticated,
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

/*
// Ejemplo de uso en App.tsx:
// const App: React.FC = () => { return (<AuthProvider><MainRouter /></AuthProvider>); };
*/