// RUTA: app/layout.tsx

import "./globals.css"
import { Inter } from "next/font/google"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ColorInitializer } from "@/components/color-initializer"
// HE AQUÍ LA CORRECCIÓN: Importa el AuthProvider.
import { AuthProvider } from "@/lib/auth"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        {/* HE AQUÍ LA CORRECCIÓN: Envuelve todo con AuthProvider. */}
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ColorInitializer />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
};