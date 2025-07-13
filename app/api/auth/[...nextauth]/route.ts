// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: {  label: "Password", type: "password" }
      },
      // Añadimos el tipo explícito para el parámetro 'credentials'
      async authorize(credentials: Record<"email" | "password", string> | undefined) {
        // A partir de aquí, el resto de la función no necesita cambios
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const connection = await pool.getConnection();
        try {
          const [rows]: [any[], any] = await connection.query(
            `SELECT u.*, c.nombre AS carrera_nombre 
             FROM usuarios u 
             LEFT JOIN carreras c ON u.carrera_id = c.id 
             WHERE u.email = ?`,
            [credentials.email]
          );
          
          if (rows.length > 0) {
            const user = rows[0];
            const passwordMatch = await bcrypt.compare(credentials.password, user.password);

            if (passwordMatch) {
              return { 
                id: user.id, 
                name: user.nombre, 
                email: user.email, 
                role: user.rol,
                carrera_id: user.carrera_id,
                carrera_nombre: user.carrera_nombre
              };
            }
          }
          return null;
        } finally {
          connection.release();
        }
      }
    })
  ],
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.id = user.id;
        // @ts-ignore
        token.role = user.role;
        // @ts-ignore
        token.carrera_id = user.carrera_id;
        // @ts-ignore
        token.carrera_nombre = user.carrera_nombre;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id;
        // @ts-ignore
        session.user.role = token.role;
        // @ts-ignore
        session.user.carrera_id = token.carrera_id;
        // @ts-ignore
        session.user.carrera_nombre = token.carrera_nombre;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };