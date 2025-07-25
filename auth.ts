
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import pool from "@/lib/db"; // Usa 'pool' con exportación por defecto
import bcrypt from "bcrypt";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const [rows]: any = await pool.query(
          "SELECT id, email, rol, nombre, password, email_verificado FROM usuarios WHERE email = ?",
          [credentials.email]
        );

        if (rows.length === 0) return null;
        const user = rows[0];

        if (!user.email_verificado) {
          // Lanza un error personalizado que se puede atrapar en el frontend
          throw new Error("EmailNotVerified");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (passwordMatch) {
          return {
            id: user.id,
            name: user.nombre,
            email: user.email,
            role: user.rol,
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/', // Tu página de login es la raíz
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.id = user.id;
        // @ts-ignore
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id;
        // @ts-ignore
        session.user.role = token.role;
      }
      return session;
    },
  },
});