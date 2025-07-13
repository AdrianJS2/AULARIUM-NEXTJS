// lib/auth.ts
"use client";

import { useSession } from "next-auth/react";

// Define los roles que tienen acceso administrativo
const ADMIN_ROLES = ["admin", "administrador"];

export function useAuth() {
  const { data: session, status } = useSession();

  const loading = status === "loading";
  const user = session?.user || null;
  // @ts-ignore - El rol se añade en el callback de NextAuth
  const userRole = user?.role || null;
  // @ts-ignore - El rol se añade en el callback de NextAuth
  const isAdmin = user?.role ? ADMIN_ROLES.includes(user.role.toLowerCase()) : false;
  
  return { user, session, loading, isAdmin, userRole, status };
}