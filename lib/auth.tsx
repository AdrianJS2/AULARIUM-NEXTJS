"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Interfaz que define la estructura del objeto de usuario
type User = {
    id: string;
    email: string;
    rol: 'admin' | 'director' | 'usuario';
    nombre: string;
    carrera_id?: number;
};

// Interfaz que define lo que el contexto de autenticación proveerá
type AuthContextType = {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    login: (credentials: { email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
    logout: () => Promise<void>;
    checkSession: () => void;
};

// Creación del contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Función para verificar la sesión del usuario al cargar la aplicación
    const checkSession = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/session');
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Fallo al verificar la sesión:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    // Función de login que llama a la API y actualiza el estado
    const login = async (credentials: { email: string; password: string }) => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Error de autenticación");
            }

            await checkSession(); // Recargamos los datos del usuario para estar seguros.
            return { ok: true };

        } catch (error: any) {
            return { ok: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    // Función de logout que llama a la API para borrar la cookie
    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error("Error al cerrar sesión en el servidor:", error);
        } finally {
            setUser(null);
            window.location.href = '/';
        }
    };
    
    const isAdmin = user?.rol === 'admin';
    
    const value = { user, loading, isAdmin, login, logout,checkSession  };

    // Esta línea ahora funcionará porque el archivo es .tsx
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook personalizado para consumir el contexto de forma segura
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};