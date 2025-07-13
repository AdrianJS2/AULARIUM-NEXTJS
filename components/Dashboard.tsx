// components/Dashboard.tsx
"use client"

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, BookOpen, School, Calendar, TrendingUp, BarChart3, PieChart, Activity, User } from "lucide-react";

interface DashboardProps {
  selectedPeriod: string;
  onNavigate: (section: string) => void;
}

// Interfaz ÚNICA que recibe TODOS los datos necesarios desde la API.
interface DashboardStats {
  profesores: number;
  materias: number;
  grupos: number;
  aulas: number;
  asignaciones: number;
  porcentajeAsignado: number;
  periodoNombre: string;
  distribucionTurnos: { mañana: number; tarde: number };
  distribucionDias: { [key: string]: number };
  recentActivity?: { type: string; name: string; date: string; action: string }[];
  isAdmin: boolean;
}

export default function Dashboard({ selectedPeriod, onNavigate }: DashboardProps) {
  // 1. ESTADO SIMPLIFICADO: Un solo estado para gobernarlos a todos.
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Solo necesitamos el 'user' para el saludo.

  // 2. FUENTE ÚNICA DE DATOS: Una sola función que llama a nuestra API.
  const fetchStats = useCallback(async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard-stats/${selectedPeriod}`);
      if (!response.ok) {
        throw new Error("No se pudieron cargar las estadísticas del panel de control.");
      }
      const data: DashboardStats = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  // 3. EFECTO SIMPLIFICADO: Solo depende de una cosa.
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // --- Funciones de ayuda para la UI (sin cambios) ---
  const getProgressColor = (value: number) => {
    if (value < 30) return "bg-red-500";
    if (value < 70) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  const getMaxDiaValue = () => {
    if (!stats) return 1;
    return Math.max(...Object.values(stats.distribucionDias), 1);
  };

  // --- Renderizado ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No se pudieron cargar los datos. Inténtalo de nuevo más tarde.</AlertDescription>
      </Alert>
    );
  }

  // --- 4. RENDERIZADO INTELIGENTE ---
  // El componente ahora es simple: si la API dice que es admin, muestra la vista de admin. Si no, la de director.
  
  // --- VISTA DE ADMINISTRADOR ---
  if (stats.isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Panel de Control</h1>
            <p className="text-muted-foreground mt-1">Bienvenido al sistema - Periodo: {stats.periodoNombre}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onNavigate("asignacion")} className="flex items-center gap-2"><School className="h-4 w-4" /> Ir a Asignación</Button>
            <Button onClick={() => onNavigate("horarios")} className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Ver Horarios</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Profesores</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.profesores}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Materias</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.materias}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Grupos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.grupos}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Aulas</CardTitle><School className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.aulas}</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Progreso de Asignación</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm"><span>Grupos con aula</span><span className="font-medium">{stats.porcentajeAsignado}%</span></div>
                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className={`h-full ${getProgressColor(stats.porcentajeAsignado)}`} style={{ width: `${stats.porcentajeAsignado}%` }}></div></div>
                </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><PieChart className="h-5 w-5 text-primary" />Distribución por Turnos</CardTitle></CardHeader>
                <CardContent>
                    <div className="w-full max-w-xs mx-auto">
                        <div className="flex justify-between mb-2"><span>Mañana</span><span>{stats.distribucionTurnos.mañana} grupos</span></div>
                        <div className="h-4 w-full bg-gray-200 rounded-full mb-4"><div className="h-full bg-orange-web rounded-full" style={{ width: `${(stats.distribucionTurnos.mañana / (stats.distribucionTurnos.mañana + stats.distribucionTurnos.tarde || 1)) * 100}%` }}></div></div>
                        <div className="flex justify-between mb-2"><span>Tarde</span><span>{stats.distribucionTurnos.tarde} grupos</span></div>
                        <div className="h-4 w-full bg-gray-200 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(stats.distribucionTurnos.tarde / (stats.distribucionTurnos.mañana + stats.distribucionTurnos.tarde || 1)) * 100}%` }}></div></div>
                    </div>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Distribución por Días</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(stats.distribucionDias).map(([dia, valor]) => (
                        <div key={dia} className="space-y-1">
                            <div className="flex justify-between text-sm"><span>{dia}</span><span className="font-medium">{valor} clases</span></div>
                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full"><div className="h-full bg-primary" style={{ width: `${(valor / getMaxDiaValue()) * 100}%` }}></div></div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }

  // --- VISTA DE DIRECTOR/USUARIO ---
  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary">Mi Panel de Control</h1>
              <p className="text-muted-foreground mt-1">Bienvenido, {user?.name || "Director"} - Periodo: {stats.periodoNombre}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onNavigate("materias-grupos")} className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Mis Materias</Button>
              <Button onClick={() => onNavigate("horarios")} className="flex items-center gap-2"><Calendar className="h-4 w-4" />Ver Horarios</Button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Mis Materias</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.materias}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Mis Grupos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.grupos}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Asignaciones</CardTitle><School className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.asignaciones}</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Mi Progreso de Asignación</CardTitle></CardHeader>
              <CardContent>
                  <div className="flex justify-between text-sm"><span>Grupos con aula</span><span className="font-medium">{stats.porcentajeAsignado}%</span></div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-2"><div className={`h-full ${getProgressColor(stats.porcentajeAsignado)}`} style={{ width: `${stats.porcentajeAsignado}%` }}></div></div>
              </CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Actividad Reciente</CardTitle></CardHeader>
              <CardContent>
                  {stats.recentActivity && stats.recentActivity.length > 0 ? (
                      <div className="space-y-4">
                          {stats.recentActivity.map((activity, index) => (
                              <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0"><div className="p-2 rounded-full bg-primary/10 text-primary"><BookOpen className="h-4 w-4" /></div><div><p className="text-sm font-medium">{activity.name}</p><p className="text-xs text-muted-foreground">Materia {activity.action} el {activity.date}</p></div></div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-6"><p className="text-muted-foreground">No hay actividad reciente</p></div>
                  )}
              </CardContent>
          </Card>
        </div>
    </div>
  )
}