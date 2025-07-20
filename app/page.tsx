// RUTA: app/page.tsx
"use client"

import { useState, useEffect } from "react";
import Auth from "../components/Auth";
import ProfesorManagement from "../components/ProfesorManagement";
import MateriaGrupoManagement from "../components/MateriaGrupoManagement";
import AsignacionAulas from "../components/AsignacionAulas";
import AulaManagement from "../components/AulaManagement";
import HorarioGrupo from "../components/HorarioGrupo";
import Dashboard from "../components/Dashboard";
import { MainLayout } from "@/components/layout/main-layout";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
// HE AQUÍ EL CAMBIO: Usamos nuestro hook como la única fuente de verdad para la autenticación.
import { useAuth } from "@/lib/auth"; 
import UserManagement from "@/components/UserManagement";

// Este es el componente principal que renderiza la aplicación o el login.
function AppContent() {
  // Obtenemos el estado de la autenticación desde nuestro hook.
  const { user, loading, isAdmin } = useAuth();
  
  const [currentSection, setCurrentSection] = useState("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState("1");
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get("section");
    if (sectionParam) {
      setCurrentSection(sectionParam);
    }
  }, []);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const getPeriodoNombre = (periodId: string) => {
      switch (periodId) {
        case "1": return "Enero-Abril";
        case "2": return "Mayo-Agosto";
        case "3": return "Septiembre-Diciembre";
        default: return "Desconocido";
      }
    };
    toast({
      title: "Periodo actualizado",
      description: getPeriodoNombre(period),
      variant: "default",
    });
  };

  const handleNavigate = (section: string) => {
    setCurrentSection(section);
  };

  // Mientras el hook de autenticación está verificando la sesión, mostramos un loader.
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Cargando aplicación...</p>
      </div>
    );
  }

  // Si el hook nos dice que NO hay usuario, mostramos el componente de Login.
  if (!user) {
    return (
      <>
        <Auth />
        <Toaster />
      </>
    );
  }

  // Si el hook nos dice que SÍ hay un usuario, mostramos la aplicación principal.
  const renderCurrentSection = () => {
    if (currentSection === "admin" && !isAdmin) {
      setTimeout(() => setCurrentSection("dashboard"), 0);
      return <Dashboard selectedPeriod={selectedPeriod} onNavigate={handleNavigate} />;
    }
    
    switch (currentSection) {
      case "dashboard": return <Dashboard selectedPeriod={selectedPeriod} onNavigate={handleNavigate} />;
      case "profesores": return <ProfesorManagement />;
      // HE AQUÍ LA CORRECCIÓN: Se eliminó el 'case' duplicado.
      case "materias-grupos": return <MateriaGrupoManagement key={selectedPeriod} selectedPeriod={selectedPeriod} />;
      case "aulas": return <AulaManagement />;
      case "asignacion": return <AsignacionAulas key={selectedPeriod} selectedPeriod={selectedPeriod} />;
      case "horarios": return <HorarioGrupo key={selectedPeriod} selectedPeriod={selectedPeriod} />;
      case "admin": return <UserManagement />;
      default: return <Dashboard selectedPeriod={selectedPeriod} onNavigate={handleNavigate} />;
    }
  };

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
  );
}

// El componente Home ahora solo necesita renderizar AppContent.
// El AuthProvider ya está envolviendo todo desde `layout.tsx`.
export default function Home() {
  return <AppContent />;
}