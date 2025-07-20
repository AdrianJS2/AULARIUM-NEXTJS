// RUTA: lib/auth.ts
"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// 1. Definimos los tipos de datos que manejará nuestro contexto.
type User = {
  id: string;
  email: string;
  rol: string;
  nombre?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: string | null;
  login: (credentials: { email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

// 2. Creamos el contexto de React con valores por defecto seguros.
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  userRole: null,
  login: async () => ({ ok: false, error: "Provider not ready" }),
  logout: async () => {},
});

// 3. Creamos el componente "Proveedor" que gestionará el estado de la autenticación.
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const checkSession = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/session');
            
            // HE AQUÍ LA CORRECCIÓN: Primero verificamos si la respuesta es exitosa.
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Error al verificar la sesión:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const login = async (credentials: { email: string; password: string }) => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            // HE AQUÍ LA CORRECCIÓN: Verificamos la respuesta ANTES de intentar leer el JSON.
            if (!response.ok) {
                // Intentamos leer el error como JSON, si falla, mostramos un error genérico.
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Error del servidor: ${response.statusText}`);
                } catch (e) {
                    throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
                }
            }

            const data = await response.json();
            setUser(data.user);
            return { ok: true };

        } catch (error: any) {
            console.error("Error en la función de login:", error);
            // Devolvemos el error para que el componente Auth.tsx lo pueda mostrar.
            return { ok: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

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
    
    const isAdmin = user?.rol?.toLowerCase() === 'admin' || user?.rol?.toLowerCase() === 'administrador';
    
    const value = { user, loading, isAdmin, userRole: user?.rol || null, login, logout };

    return React.createElement(AuthContext.Provider, { value }, children);
}

export const useAuth = () => useContext(AuthContext);