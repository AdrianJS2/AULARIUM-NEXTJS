// app/layout.tsx
import "./globals.css"
import { Inter } from "next/font/google"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ColorInitializer } from "@/components/color-initializer"
import NextAuthProvider from "@/components/SessionProvider" // <-- Importar el nuevo proveedor

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <NextAuthProvider> {/* <-- Envolver con el proveedor */}
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ColorInitializer />
            {children}
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };