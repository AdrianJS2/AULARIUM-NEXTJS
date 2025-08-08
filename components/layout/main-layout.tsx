"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth" // Se utiliza el hook para la sesión
import NotificacionesAdmin from "@/components/NotificacionesAdmin"
import { useToast } from "@/components/ui/use-toast"

interface MainLayoutProps {
  children: React.ReactNode
  currentSection?: string
  onNavigate?: (section: string) => void
  selectedPeriod?: string
  onPeriodChange?: (period: string) => void
  isAdmin?: boolean
}

export function MainLayout({
  children,
  currentSection = "dashboard",
  onNavigate = () => {},
  selectedPeriod = "1",
  onPeriodChange = () => {},
  isAdmin = false,
}: MainLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // ✅ CORRECCIÓN: Obtenemos 'logout' y 'user' de nuestro hook centralizado.
  const { logout, user } = useAuth()
  const { toast } = useToast()

  const periodo =
    selectedPeriod === "1" ? "enero-abril" : selectedPeriod === "2" ? "mayo-agosto" : "septiembre-diciembre"

  const getSectionTitle = () => {
    switch (currentSection) {
      case "dashboard": return "Dashboard"
      case "profesores": return "Gestión de Profesores"
      case "materias-grupos": return "Materias y Grupos"
      case "aulas": return "Gestión de Aulas"
      case "asignacion": return "Asignación de Aulas"
      case "horarios": return "Horarios"
      case "admin": return "Panel de Administración"
      default: return "Dashboard"
    }
  }

  // ❌ ELIMINADO: El useEffect que llamaba a `supabase.auth.getSession()` ha sido eliminado.
  // El AuthProvider ya se encarga de gestionar el estado del usuario.

  // ✅ CORRECCIÓN: La función de logout ahora utiliza el método del hook.
  const handleSignOut = async () => {
    toast({ title: "Cerrando sesión..." })
    await logout()
  }

  // Cerrar el menú móvil cuando cambia la sección
  useEffect(() => {
    setIsMobileOpen(false)
  }, [currentSection])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <Sidebar
        currentSection={currentSection}
        onNavigate={onNavigate}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        setIsMobileOpen={setIsMobileOpen}
        onSignOut={handleSignOut}
        selectedPeriod={selectedPeriod}
        onPeriodChange={onPeriodChange}
        isAdmin={isAdmin}
      />
      <div className={`${isCollapsed ? "ml-20" : "ml-72"} transition-all duration-300 min-h-screen`}>
        <header className="sticky top-0 z-40 w-full border-b bg-white dark:bg-oxford-blue text-oxford-blue dark:text-white">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <h1 className="text-xl font-bold">{getSectionTitle()}</h1>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={() => onPeriodChange("1")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors hover:bg-oxford-blue/10 dark:hover:bg-white/10 ${
                    periodo === "enero-abril" ? "bg-oxford-blue/20 dark:bg-white/20" : ""
                  }`}
                >
                  Enero-Abril
                </button>
                <button
                  onClick={() => onPeriodChange("2")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors hover:bg-oxford-blue/10 dark:hover:bg-white/10 ${
                    periodo === "mayo-agosto" ? "bg-oxford-blue/20 dark:bg-white/20" : ""
                  }`}
                >
                  Mayo-Agosto
                </button>
                <button
                  onClick={() => onPeriodChange("3")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors hover:bg-oxford-blue/10 dark:hover:bg-white/10 ${
                    periodo === "septiembre-diciembre" ? "bg-oxford-blue/20 dark:bg-white/20" : ""
                  }`}
                >
                  Septiembre-Diciembre
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileOpen(true)}
                    className="text-oxford-blue dark:text-white"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>
                {isAdmin && <NotificacionesAdmin />}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        <div className="md:hidden p-4 border-b">
          <Tabs value={selectedPeriod} onValueChange={onPeriodChange} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="1" className="flex-1">Ene-Abr</TabsTrigger>
              <TabsTrigger value="2" className="flex-1">May-Ago</TabsTrigger>
              <TabsTrigger value="3" className="flex-1">Sep-Dic</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </ThemeProvider>
  )
}