// client/src/context/AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';

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

    // Función que maneja la lógica de autenticación (simulación de llamada API)
    const login = async (nickname: string) => {
        // --- LÓGICA DE AUTHENTICACIÓN REAL ---
        
        // 1. Llamada a la API REST (e.g., POST /api/auth)
        // const response = await fetch('...');
        
        // 2. Si es exitoso, se recibe el socketID y otros datos de sesión.

        // SIMULACIÓN:
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const mockSocketID = 'mock-' + Math.random().toString(10).slice(2, 8);
                setCurrentUser({ nickname, socketID: mockSocketID });
                console.log(`[AUTH] Usuario ${nickname} logueado con Socket ID: ${mockSocketID}`);
                resolve();
            }, 500);
        });
    };

    const logout = () => {
        // Aquí se limpiaría la sesión del usuario (localStorage, cookies, etc.)
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