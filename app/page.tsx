// app/page.tsx

"use client"

import { useState, useEffect, useRef } from "react"
import { supabase, getSessionSafely } from "@/lib/supabase"
import Auth from "../components/Auth"
import ProfesorManagement from "../components/ProfesorManagement"
import MateriaGrupoManagement from "../components/MateriaGrupoManagement"
import AsignacionAulas from "../components/AsignacionAulas"
import AulaManagement from "../components/AulaManagement"
import HorarioGrupo from "../components/HorarioGrupo"
import Dashboard from "../components/Dashboard"
import { MainLayout } from "@/components/layout/main-layout"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth"
import UserManagement from "@/components/UserManagement"

const ADMIN_ROLES = ["admin", "administrador"]

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [currentSection, setCurrentSection] = useState("dashboard")
  const [selectedPeriod, setSelectedPeriod] = useState("1")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { isAdmin, userRole, refreshUserRole } = useAuth()
  const [isMounted, setIsMounted] = useState(false) // 1. Añadimos el estado de montaje

  // 2. Este useEffect se ejecuta SOLO en el cliente para indicar que ya está montado
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sectionParam = urlParams.get("section")
    if (sectionParam) {
      setCurrentSection(sectionParam)
    }
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = await getSessionSafely()
        setSession(sessionData)
      } catch (e) {
        console.error("Failed to fetch session:", e)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    const getPeriodoNombre = (periodId: string) => {
      switch (periodId) {
        case "1": return "Enero-Abril";
        case "2": return "Mayo-Agosto";
        case "3": return "Septiembre-Diciembre";
        default: return "Desconocido";
      }
    }
    toast({
      title: "Periodo actualizado",
      description: getPeriodoNombre(period),
      variant: "default",
    })
  }

  const handleNavigate = (section: string) => {
    setCurrentSection(section)
  }

  // 3. Lógica de renderizado segura para la hidratación
  // Si no está montado o está cargando, muestra un loader simple y consistente.
  if (!isMounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Cargando aplicación...</p>
      </div>
    )
  }

  // 4. Una vez montado, ahora sí podemos renderizar la lógica condicional
  if (!session) {
    return (
      <>
        <Auth />
        <Toaster />
      </>
    )
  }

  const renderCurrentSection = () => {
    if (currentSection === "admin" && !isAdmin) {
      setTimeout(() => setCurrentSection("dashboard"), 0)
      return <Dashboard selectedPeriod={selectedPeriod} onNavigate={handleNavigate} />
    }
    
    switch (currentSection) {
      case "dashboard": return <Dashboard selectedPeriod={selectedPeriod} onNavigate={handleNavigate} />;
      case "profesores": return <ProfesorManagement />;
      case "materias-grupos": return <MateriaGrupoManagement selectedPeriod={selectedPeriod} />;
      case "aulas": return <AulaManagement />;
      case "asignacion": return <AsignacionAulas selectedPeriod={selectedPeriod} />;
      case "horarios": return <HorarioGrupo selectedPeriod={selectedPeriod} />;
      case "admin": return <UserManagement />;
      default: return <Dashboard selectedPeriod={selectedPeriod} onNavigate={handleNavigate} />;
    }
  }

  return (
    <>
      <MainLayout
        currentSection={currentSection}
        onNavigate={handleNavigate}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        isAdmin={isAdmin}
      >
        {renderCurrentSection()}
      </MainLayout>
      <Toaster />
    </>
  )
}