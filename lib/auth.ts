"use client"



import React, { createContext, useContext, useEffect, useState, useCallback } from "react";



// 1. Asegúrate de que el tipo User incluya todos los campos necesarios.

type User = {

  id: string;

  email: string;

  rol: string;

  nombre?: string;

  carrera_id?: number; // <-- ¡MUY IMPORTANTE!

};



type AuthContextType = {

  user: User | null;

  loading: boolean;

  isAdmin: boolean;

  login: (credentials: { email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;

  logout: () => Promise<void>;

};



const AuthContext = createContext<AuthContextType>({

  user: null,

  loading: true,

  isAdmin: false,

  login: async () => ({ ok: false, error: "Provider not ready" }),

  logout: async () => {},

});



export function AuthProvider({ children }: { children: React.ReactNode }) {

    const [user, setUser] = useState<User | null>(null);

    const [loading, setLoading] = useState(true);



    const checkSession = useCallback(async () => {

        try {

            // 2. Tu API de sesión debe devolver el objeto de usuario completo.

            const response = await fetch('/api/auth/session');

           

            if (response.ok) {

                const data = await response.json();

                // 3. Se guarda el usuario completo (incluyendo carrera_id) en el estado.

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



    // ... (El resto de las funciones login y logout se mantienen igual) ...



    const login = async (credentials: { email: string; password: string }) => {

      setLoading(true);

      try {

          const response = await fetch('/api/auth/login', {

              method: 'POST',

              headers: { 'Content-Type': 'application/json' },

              body: JSON.stringify(credentials),

          });



          if (!response.ok) {

              const errorData = await response.json();

              throw new Error(errorData.error || `Error del servidor`);

          }



          const data = await response.json();

          setUser(data.user); // El login también debe devolver el usuario completo.

          return { ok: true };



      } catch (error: any) {

          return { ok: false, error: error.message };

      } finally {

          setLoading(false);

      }

    };



    const logout = async () => {

        await fetch('/api/auth/logout', { method: 'POST' });

        setUser(null);

        window.location.href = '/';

    };

   

    // El cálculo de isAdmin se basa en el 'rol' del objeto user.

    const isAdmin = user?.rol?.toLowerCase() === 'admin' || user?.rol?.toLowerCase() === 'administrador';

   

    // El valor del contexto ahora solo expone lo necesario.

    const value = { user, loading, isAdmin, login, logout };



    return React.createElement(AuthContext.Provider, { value }, children);

}



// Hook para consumir el contexto.

export const useAuth = () => useContext(AuthContext);