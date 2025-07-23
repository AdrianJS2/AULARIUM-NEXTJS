"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, BookOpen, School, Calendar, TrendingUp, BarChart3, PieChart, Activity, User } from "lucide-react"
import { MigrationStatus } from './MigrationStatus';
import { useAuth } from "@/lib/auth";// Se usa el hook para la info del usuario

interface DashboardProps {
  selectedPeriod: string
  onNavigate: (section: string) => void

}
const initialStats = {
  profesores: 0,
  materias: 0,
  grupos: 0,
  aulas: 0,
  asignaciones: 0,
  porcentajeAsignado: 0,
  userMateriaCount: 0, // Añadido para la vista personal
  userGrupoCount: 0,   // Añadido para la vista personal
  userAsignacionCount: 0 // Añadido para la vista personal
};
export default function Dashboard({ selectedPeriod, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({initialStats})
  const [loading, setLoading] = useState(true)
  const [periodoNombre, setPeriodoNombre] = useState("")
  const [distribucionTurnos, setDistribucionTurnos] = useState({ mañana: 0, tarde: 0 })
  const [distribucionDias, setDistribucionDias] = useState({
    Lunes: 0,
    Martes: 0,
    Miércoles: 0,
    Jueves: 0,
    Viernes: 0,
  })

  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const { user, isAdmin } = useAuth(); // Se usa el hook para la info del usuario

  const fetchStats = useCallback(async () => {
    if (!selectedPeriod || !user?.id) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/dashboard?periodoId=${selectedPeriod}&userId=${user.id}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar las estadísticas.');
      }
      const data = await response.json();

      setStats(data.stats || initialStats);
            setPeriodoNombre(data.periodoNombre || "No definido");
            setDistribucionTurnos(data.distribucionTurnos || { mañana: 0, tarde: 0 });
            setDistribucionDias(data.distribucionDias || { Lunes: 0, Martes: 0, Miércoles: 0, Jueves: 0, Viernes: 0 });
            setRecentActivity(data.recentActivity || []);

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const fetchRecentActivity = async (userId: string | null) => {
    if (!userId || !selectedPeriod) return

    const tables = getTableNamesByPeriod(selectedPeriod)

    try {
      // Get user's recent materias (last 5)
      const { data: recentMaterias } = await supabase
        .from(tables.materias)
        .select("nombre, created_at")
        .eq("usuario_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)

      // Format the activity data
      const activities = (recentMaterias || []).map((materia) => ({
        type: "materia",
        name: materia.nombre,
        date: new Date(materia.created_at).toLocaleDateString(),
        action: "creada",
      }))

      setRecentActivity(activities)
    } catch (error) {
      console.error("Error fetching recent activity:", error)
    }
  }

  const fetchPeriodoNombre = async () => {
    try {
      const { data, error } = await supabase.from("periodos").select("nombre").eq("id", selectedPeriod).single()

      if (error) throw error
      if (data) setPeriodoNombre(data.nombre)
    } catch (error) {
      console.error("Error fetching periodo:", error)
    }
  }



  

  const fetchDistribucionTurnos = async () => {
    try {
      if (!selectedPeriod) return

      const tables = getTableNamesByPeriod(selectedPeriod)

      const { data, error } = await supabase.from(tables.grupos).select("turno")

      if (error) throw error

      const mañana = data?.filter((g) => g.turno === "MAÑANA").length || 0
      const tarde = data?.filter((g) => g.turno === "TARDE").length || 0

      setDistribucionTurnos({ mañana, tarde })
    } catch (error) {
      console.error("Error fetching turnos:", error)
    }
  }

  const fetchPersonalDistribucionTurnos = async (materiaIds: number[]) => {
    try {
      if (!selectedPeriod || materiaIds.length === 0) return

      const tables = getTableNamesByPeriod(selectedPeriod)

      const { data, error } = await supabase.from(tables.grupos).select("turno").in("materia_id", materiaIds)

      if (error) throw error

      const mañana = data?.filter((g) => g.turno === "MAÑANA").length || 0
      const tarde = data?.filter((g) => g.turno === "TARDE").length || 0

      setDistribucionTurnos({ mañana, tarde })
    } catch (error) {
      console.error("Error fetching personal turnos:", error)
    }
  }

  const fetchDistribucionDias = async () => {
    try {
      if (!selectedPeriod) return

      const tables = getTableNamesByPeriod(selectedPeriod)

      const { data, error } = await supabase.from(tables.asignaciones).select("dia")

      if (error) throw error

      const distribucion = {
        Lunes: data?.filter((a) => a.dia === "Lunes").length || 0,
        Martes: data?.filter((a) => a.dia === "Martes").length || 0,
        Miércoles: data?.filter((a) => a.dia === "Miércoles").length || 0,
        Jueves: data?.filter((a) => a.dia === "Jueves").length || 0,
        Viernes: data?.filter((a) => a.dia === "Viernes").length || 0,
      }

      setDistribucionDias(distribucion)
    } catch (error) {
      console.error("Error fetching distribución por días:", error)
    }
  }


  const getTableNamesByPeriod = (periodId: string) => {
    switch (periodId) {
      case "1":
        return {
          materias: "materias_enero_abril",
          grupos: "grupos_enero_abril",
          asignaciones: "asignaciones_enero_abril",
        }
      case "2":
        return {
          materias: "materias_mayo_agosto",
          grupos: "grupos_mayo_agosto",
          asignaciones: "asignaciones_mayo_agosto",
        }
      case "3":
        return {
          materias: "materias_septiembre_diciembre",
          grupos: "grupos_septiembre_diciembre",
          asignaciones: "asignaciones_septiembre_diciembre",
        }
      default:
        return {
          materias: "materias_enero_abril",
          grupos: "grupos_enero_abril",
          asignaciones: "asignaciones_enero_abril",
        }
    }
  }

  // Función para obtener el color de la barra según el valor
  const getProgressColor = (value: number) => {
    if (value < 30) return "bg-red-500"
    if (value < 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  // Función para obtener el máximo valor en la distribución de días
  const getMaxDiaValue = () => {
    return Math.max(...Object.values(distribucionDias), 1); // Evita división por cero
};
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!selectedPeriod) {
    return (
      <Alert>
        <AlertDescription>Por favor, selecciona un periodo académico para ver el dashboard.</AlertDescription>
      </Alert>
    )
  }
  if (isAdmin) {
    // Admin Dashboard - Global View
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Panel de Control</h1>
            <p className="text-muted-foreground mt-1">
              Bienvenido al sistema de asignación de aulas - Periodo: {periodoNombre}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onNavigate("asignacion")} className="flex items-center gap-2">
              <School className="h-4 w-4" />
              Ir a Asignación
            </Button>
            <Button onClick={() => onNavigate("horarios")} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ver Horarios
            </Button>
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profesores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.profesores}</div>
              <p className="text-xs text-muted-foreground">Profesores registrados en el sistema</p>
            </CardContent>
            <CardFooter className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-between text-xs"
                onClick={() => onNavigate("profesores")}
              >
                Ver profesores
                <span>→</span>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Materias</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.materias}</div>
              <p className="text-xs text-muted-foreground">Materias en el periodo actual</p>
            </CardContent>
            <CardFooter className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-between text-xs"
                onClick={() => onNavigate("materias-grupos")}
              >
                Ver materias
                <span>→</span>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Grupos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.grupos}</div>
              <p className="text-xs text-muted-foreground">Grupos en el periodo actual</p>
            </CardContent>
            <CardFooter className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-between text-xs"
                onClick={() => onNavigate("materias-grupos")}
              >
                Ver grupos
                <span>→</span>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aulas</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.aulas}</div>
              <p className="text-xs text-muted-foreground">Aulas disponibles</p>
            </CardContent>
            <CardFooter className="p-2">
              <Button variant="ghost" className="w-full justify-between text-xs" onClick={() => onNavigate("aulas")}>
                Ver aulas
                <span>→</span>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Gráficos y estadísticas adicionales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Progreso de Asignación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Grupos con aula asignada</span>
                  <span className="font-medium">{stats.porcentajeAsignado}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(stats.porcentajeAsignado)} transition-all duration-500`}
                    style={{ width: `${stats.porcentajeAsignado}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total de grupos</p>
                    <p className="text-xl font-bold">{stats.grupos}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Asignaciones</p>
                    <p className="text-xl font-bold">{stats.asignaciones}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Distribución por Turnos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[180px]">
                <div className="w-full max-w-xs">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-orange-web mr-2"></div>
                      <span className="text-sm">Mañana</span>
                    </div>
                    <span className="text-sm font-medium">{distribucionTurnos.mañana} grupos</span>
                  </div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
                    <div
                      className="h-full bg-orange-web rounded-full"
                      style={{
                        width: `${
                          distribucionTurnos.mañana + distribucionTurnos.tarde > 0
                            ? (distribucionTurnos.mañana / (distribucionTurnos.mañana + distribucionTurnos.tarde)) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm">Tarde</span>
                    </div>
                    <span className="text-sm font-medium">{distribucionTurnos.tarde} grupos</span>
                  </div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${
                          distribucionTurnos.mañana + distribucionTurnos.tarde > 0
                            ? (distribucionTurnos.tarde / (distribucionTurnos.mañana + distribucionTurnos.tarde)) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Distribución por Días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(distribucionDias).map(([dia, valor]) => (
                  <div key={dia} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{dia}</span>
                      <span className="font-medium">{valor} clases</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${getMaxDiaValue() > 0 ? (valor / getMaxDiaValue()) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Resumen del Periodo {periodoNombre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Estadísticas Generales</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Profesores:</span>
                      <span className="font-medium">{stats.profesores}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Materias:</span>
                      <span className="font-medium">{stats.materias}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Grupos:</span>
                      <span className="font-medium">{stats.grupos}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Aulas:</span>
                      <span className="font-medium">{stats.aulas}</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Distribución de Turnos</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Mañana:</span>
                      <span className="font-medium">{distribucionTurnos.mañana} grupos</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Tarde:</span>
                      <span className="font-medium">{distribucionTurnos.tarde} grupos</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Ratio:</span>
                      <span className="font-medium">
                        {distribucionTurnos.mañana + distribucionTurnos.tarde > 0
                          ? `${Math.round(
                              (distribucionTurnos.mañana / (distribucionTurnos.mañana + distribucionTurnos.tarde)) *
                                100,
                            )}% / ${Math.round(
                              (distribucionTurnos.tarde / (distribucionTurnos.mañana + distribucionTurnos.tarde)) * 100,
                            )}%`
                          : "N/A"}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Asignación de Aulas</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Asignados:</span>
                      <span className="font-medium">{stats.asignaciones}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Pendientes:</span>
                      <span className="font-medium">{Math.max(0, stats.grupos - stats.asignaciones)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Progreso:</span>
                      <span className="font-medium">{stats.porcentajeAsignado}%</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          {isAdmin && <MigrationStatus />}
      </div>
    )
  } else {
    // Director/User Dashboard - Personal View
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Mi Panel de Control</h1>
            <p className="text-muted-foreground mt-1">
              Bienvenido, {user?.nombre || "Director"} - Periodo: {periodoNombre}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onNavigate("materias-grupos")} className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Mis Materias
            </Button>
            <Button onClick={() => onNavigate("horarios")} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ver Horarios
            </Button>
          </div>
        </div>

        {/* Tarjetas de estadísticas personales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mis Materias</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.userMateriaCount}</div>
              <p className="text-xs text-muted-foreground">Materias creadas por ti</p>
            </CardContent>
            <CardFooter className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-between text-xs"
                onClick={() => onNavigate("materias-grupos")}
              >
                Ver mis materias
                <span>→</span>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mis Grupos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.userGrupoCount}</div>
              <p className="text-xs text-muted-foreground">Grupos en tus materias</p>
            </CardContent>
            <CardFooter className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-between text-xs"
                onClick={() => onNavigate("materias-grupos")}
              >
                Ver mis grupos
                <span>→</span>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Asignaciones</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.userAsignacionCount}</div>
              <p className="text-xs text-muted-foreground">Aulas asignadas a tus grupos</p>
            </CardContent>
            <CardFooter className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-between text-xs"
                onClick={() => onNavigate("asignacion")}
              >
                Ver asignaciones
                <span>→</span>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Mi Progreso de Asignación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Grupos con aula asignada</span>
                <span className="font-medium">{stats.porcentajeAsignado}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(stats.porcentajeAsignado)} transition-all duration-500`}
                  style={{ width: `${stats.porcentajeAsignado}%` }}
                ></div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total de mis grupos</p>
                  <p className="text-xl font-bold">{stats.userGrupoCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Mis asignaciones</p>
                  <p className="text-xl font-bold">{stats.userAsignacionCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Materia {activity.action} el {activity.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No hay actividad reciente</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Distribución de Mis Grupos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[180px]">
                <div className="w-full max-w-xs">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-orange-web mr-2"></div>
                      <span className="text-sm">Mañana</span>
                    </div>
                    <span className="text-sm font-medium">{distribucionTurnos.mañana} grupos</span>
                  </div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
                    <div
                      className="h-full bg-orange-web rounded-full"
                      style={{
                        width: `${
                          distribucionTurnos.mañana + distribucionTurnos.tarde > 0
                            ? (distribucionTurnos.mañana / (distribucionTurnos.mañana + distribucionTurnos.tarde)) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm">Tarde</span>
                    </div>
                    <span className="text-sm font-medium">{distribucionTurnos.tarde} grupos</span>
                  </div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${
                          distribucionTurnos.mañana + distribucionTurnos.tarde > 0
                            ? (distribucionTurnos.tarde / (distribucionTurnos.mañana + distribucionTurnos.tarde)) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Recursos Disponibles</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Total de profesores:</span>
                    <span className="font-medium">{stats.profesores}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Total de aulas:</span>
                    <span className="font-medium">{stats.aulas}</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Periodo Actual</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="font-medium">{periodoNombre}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <span className="font-medium">Activo</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Mi Cuenta</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Rol:</span>
                    <span className="font-medium capitalize">{user?.rol || "Director"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Materias creadas:</span>
                    <span className="font-medium">{stats.userMateriaCount}</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
      </div>
    )
  }
  // Render different dashboards based on user role
  
  
}
