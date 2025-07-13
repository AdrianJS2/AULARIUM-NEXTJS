// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

// Extiende el token JWT para que incluya nuestras propiedades personalizadas
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string | null;
    carrera_id?: number | null;
    carrera_nombre?: string | null;
  }
}

// Extiende la sesión para que el objeto `session.user` también las incluya
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string | null;
      carrera_id?: number | null;
      carrera_nombre?: string | null;
    } & DefaultSession["user"]; // Mantenemos las propiedades por defecto
  }

  // Extiende el objeto User para que coincida con lo que retorna `authorize`
  interface User {
    role?: string | null;
    carrera_id?: number | null;
    carrera_nombre?: string | null;
  }
}