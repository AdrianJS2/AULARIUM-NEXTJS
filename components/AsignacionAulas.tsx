"use client"
import { featureFlags } from '@/lib/config'; // Importar feature flags
import { useState, useEffect, useCallback } from "react"
import { supabase, fetchWithRetry } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle, AlertTriangle } from "@/components/ui/alert"
// import { isAdmin, getUserRole } from "@/lib/auth"
import { useAuth } from "@/lib/auth";
import HorarioSemanal from "./HorarioSemanal"
import { DndContext, closestCenter } from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { useToast } from "@/components/ui/use-toast"
import { FileDown } from "lucide-react"

interface Grupo {
  id: number
  materia_id: number
  numero: string
  alumnos: number
  turno: "MAÑANA" | "TARDE"
  horarios: {
    dia: string
    hora_inicio: string
    hora_fin: string
  }[]
}

interface Materia {
  id: number
  nombre: string
  profesor_id: number | null
}

interface Aula {
  id: number
  nombre: string
  capacidad: number
}

interface Asignacion {
  id?: number
  grupo_id: number
  aula_id: number | null
  materia_id: number
  dia: string
  hora_inicio: string
  hora_fin: string
  turno: "MAÑANA" | "TARDE"
}

interface Props {
  selectedPeriod: string
}

export default function AsignacionAulas({ selectedPeriod }: Props) {
  const { user, userRole, isAdmin } = useAuth();
    const currentUserId = user?.id;
    const userCarreraId = null; // Este dato ya no se obtiene aquí.
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false)


 
  const [retryCount, setRetryCount] = useState(0)
  // Dentro del componente, agregar:
  const { toast } = useToast()
  const [solicitando, setSolicitando] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState<any>(null)
  const [carreraNombre, setCarreraNombre] = useState<string>("")

  const [cambiosPendientes, setCambiosPendientes] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [asignacionesOriginales, setAsignacionesOriginales] = useState<Asignacion[]>([])

  const useMySqlApi = featureFlags.asignacion === 'mysql';
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
        throw new Error("Periodo no válido")
    }
  }

  useEffect(() => {
    async function fetchUserData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error("Error fetching user:", userError)
          toast({
            title: "Error de autenticación",
            description: "No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.",
            variant: "destructive",
          })
          return
        }

        if (user) {
          setCurrentUserId(user.id)
          const admin = await isAdmin(user.id)
          setIsUserAdmin(admin)
          const { rol, carrera_id } = await getUserRole(user.id)
          setUserRole(rol)
          setUserCarreraId(carrera_id)

          // Obtener datos completos del usuario
          const { data: userData, error: userDataError } = await supabase
            .from("usuarios")
            .select("*")
            .eq("id", user.id)
            .single()

          if (!userDataError && userData) {
            setUsuarioActual(userData)

            // Si el usuario tiene una carrera asignada, obtener el nombre de la carrera
            if (carrera_id) {
              const { data: carreraData, error: carreraError } = await supabase
                .from("carreras")
                .select("nombre")
                .eq("id", carrera_id)
                .single()

              if (!carreraError && carreraData) {
                setCarreraNombre(carreraData.nombre)
              }
            }
          }
        } else {
          console.warn("No user found")
          toast({
            title: "No autenticado",
            description: "Por favor, inicie sesión para acceder a esta funcionalidad.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al obtener los datos del usuario. Por favor, recargue la página.",
          variant: "destructive",
        })
      }
    }

    fetchUserData()
  }, [])

  const fetchData = useCallback(async () => {
    if (!selectedPeriod || !currentUserId) return;
    setLoading(true);
    setError(null);
    try {
        if (useMySqlApi) {
            // Hacemos una única llamada a nuestra nueva API para obtener todos los datos.
            const response = await fetch(`/api/asignaciones?periodoId=${selectedPeriod}&userId=${currentUserId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al cargar datos de asignación.');
            }
            const data = await response.json();

            setAulas(data.aulas || []);
            setMaterias(data.materias || []);
            const parsedGrupos = (data.grupos || []).map((grupo: any) => ({
                ...grupo,
                horarios: Array.isArray(grupo.horarios) ? grupo.horarios : JSON.parse(grupo.horarios || "[]"),
            }));
            setGrupos(parsedGrupos);
            setAsignaciones(data.asignaciones || []);
            setAsignacionesOriginales(JSON.parse(JSON.stringify(data.asignaciones || [])));

        } else {
            // Lógica de Supabase como fallback (se mantiene por si acaso)
            console.log("Usando Supabase para Asignacion");
            const tables = getTableNamesByPeriod(selectedPeriod);
            const { data: aulasData, error: aulasError } = await supabase.from("aulas").select("*");
            if (aulasError) throw aulasError;
            // ... (el resto de tu lógica de Supabase)
        }
        
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
}, [selectedPeriod, currentUserId, useMySqlApi]);

  useEffect(() => {
    if (selectedPeriod) {
      setLoading(true)
      setRetryCount(0)
      fetchData()
    }
  }, [fetchData, selectedPeriod])

  // Configurar suscripción en tiempo real a las asignaciones
  useEffect(() => {
    if (selectedPeriod) {
      const tables = getTableNamesByPeriod(selectedPeriod)

      // Suscribirse a cambios en la tabla de asignaciones
      const channel = supabase
        .channel("asignaciones-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: tables.asignaciones,
          },
          () => {
            // Actualizar datos cuando haya cambios
            console.log("Received realtime update for asignaciones")
            fetchData()
          },
        )
        .subscribe()

      // Limpiar suscripción al desmontar
      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedPeriod, fetchData])

  // Función para verificar si hay cambios pendientes
  const verificarCambiosPendientes = useCallback(() => {
    if (!asignacionesOriginales.length || !asignaciones.length) return false

    // Comparar directamente las asignaciones actuales con las originales
    for (const asignacion of asignaciones) {
      if (!asignacion.id) continue

      const original = asignacionesOriginales.find((a) => a.id === asignacion.id)
      if (!original) {
        console.log(`Cambio detectado: Nueva asignación ${asignacion.id}`)
        return true
      }

      if (original.aula_id !== asignacion.aula_id) {
        console.log(
          `Cambio detectado: Asignación ${asignacion.id} cambió de aula_id=${original.aula_id} a aula_id=${asignacion.aula_id}`,
        )
        return true
      }
    }

    // También verificar si alguna asignación original ya no existe
    for (const original of asignacionesOriginales) {
      if (!original.id) continue

      const actual = asignaciones.find((a) => a.id === original.id)
      if (!actual) {
        console.log(`Cambio detectado: Asignación ${original.id} eliminada`)
        return true
      }
    }

    return false
  }, [asignaciones, asignacionesOriginales])

  // Actualizar el estado de cambiosPendientes cuando cambien las asignaciones
  useEffect(() => {
    if (asignaciones.length && asignacionesOriginales.length) {
      const hayPendientes = verificarCambiosPendientes()
      setCambiosPendientes(hayPendientes)
    }
  }, [asignaciones, asignacionesOriginales, verificarCambiosPendientes])

  // Función para solicitar asignación de aulas
  const handleSolicitarAsignacion = async () => {
    if (!selectedPeriod || !usuarioActual) {
      toast({
        title: "Error",
        description: "Falta información necesaria para realizar la solicitud",
        variant: "destructive",
      })
      return
    }

    setSolicitando(true)
    try {
      // Obtener todos los administradores
      const response = await fetch("/api/admins")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al obtener administradores")
      }

      const { admins } = await response.json()

      if (!admins || admins.length === 0) {
        throw new Error("No hay administradores disponibles")
      }

      // Determinar el nombre del periodo
      const nombrePeriodo =
        selectedPeriod === "1" ? "Enero-Abril" : selectedPeriod === "2" ? "Mayo-Agosto" : "Septiembre-Diciembre"

      // Crear notificaciones para cada administrador
      for (const admin of admins) {
        const notificacionData = {
          tipo: "SOLICITUD_ASIGNACION",
          mensaje: `${usuarioActual.nombre} solicita asignación de aulas para el periodo ${nombrePeriodo}`,
          datos: {
            periodo: selectedPeriod,
            solicitante: {
              id: usuarioActual.id,
              nombre: usuarioActual.nombre,
              email: usuarioActual.email,
            },
            carrera: carreraNombre,
            fecha: new Date().toISOString(),
          },
          destinatario_id: admin.id,
          remitente_id: usuarioActual.id, // Añadir el remitente_id
        }

        const notifResponse = await fetch("/api/notificaciones", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notificacionData),
        })

        if (!notifResponse.ok) {
          const errorData = await notifResponse.json()
          throw new Error(errorData.error || `Error al enviar notificación a ${admin.email}`)
        }
      }

      toast({
        title: "Solicitud enviada",
        description:
          "Se ha enviado la solicitud de asignación de aulas a los administradores. Recibirás una notificación cuando sea procesada.",
      })
    } catch (error) {
      console.error("Error al solicitar asignación:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo enviar la solicitud. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSolicitando(false)
    }
  }

  async function asignarAulas() {
    if (!selectedPeriod) {
      toast({
        title: "Error",
        description: "Por favor seleccione un periodo académico",
        variant: "destructive",
      })
      return
    }

    if (!aulas || aulas.length === 0) {
      toast({
        title: "Error",
        description: "No hay aulas disponibles para asignar",
        variant: "destructive",
      })
      return
    }

    if (grupos.length === 0) {
      toast({
        title: "Error",
        description: `No hay grupos disponibles para el periodo ${selectedPeriod === "1" ? "Enero-Abril" : selectedPeriod === "2" ? "Mayo-Agosto" : "Septiembre-Diciembre"}`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log(
        `Iniciando asignación de aulas para periodo ${selectedPeriod} (${selectedPeriod === "1" ? "Enero-Abril" : selectedPeriod === "2" ? "Mayo-Agosto" : "Septiembre-Diciembre"})`,
      )

      let endpoint = ""
      switch (selectedPeriod) {
        case "1":
          endpoint = "/api/asignar-aulas/enero-abril"
          break
        case "2":
          endpoint = "/api/asignar-aulas/mayo-agosto"
          break
        case "3":
          endpoint = "/api/asignar-aulas/septiembre-diciembre"
          break
        default:
          throw new Error("Periodo no válido")
      }

      console.log("Using endpoint:", endpoint)
      console.log("Sending request with aulas:", aulas.length)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aulas: aulas,
          carreraId: userCarreraId, 
          userId: currentUserId,// Añadir carreraId si el usuario es coordinador
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response from server:", errorData)
        throw new Error(errorData.error || `Error al asignar aulas: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Assignment successful. New assignments:", data.length)

      if (!data || data.length === 0) {
        toast({
          title: "Advertencia",
          description: "No se pudieron crear asignaciones. Verifique que haya grupos y aulas disponibles.",
          variant: "warning",
        })
      } else {
        setAsignaciones(data)
        toast({
          title: "Éxito",
          description: `Las aulas han sido asignadas correctamente para el periodo ${selectedPeriod === "1" ? "Enero-Abril" : selectedPeriod === "2" ? "Mayo-Agosto" : "Septiembre-Diciembre"}`,
        })
      }

      // Refresh data after assignment
      await fetchData()
    } catch (error) {
      console.error("Error assigning classrooms:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al asignar aulas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function deshacerAsignacion() {
    if (!selectedPeriod || !currentUserId) {
        toast({ title: "Error", description: "No se pudo identificar el período o el usuario.", variant: "destructive" });
        return;
    }
    setLoading(true);
    try {
        // HE AQUÍ LA CORRECCIÓN: Lógica clara con if/else.
        if (useMySqlApi) {
            const response = await fetch("/api/asignaciones", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'deshacer',
                    periodoId: selectedPeriod,
                    userId: currentUserId, // La API usará este ID para determinar los permisos
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al deshacer la asignación desde la API.");
            }
        } else {
            // Lógica de fallback para Supabase
            const response = await fetch("/api/deshacer-asignacion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ periodoId: selectedPeriod }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al deshacer la asignación con la lógica antigua.");
            }
        }
        
        toast({ title: "Éxito", description: "Se han eliminado las asignaciones del periodo." });
        await fetchData();

    } catch (error) {
        console.error("Error undoing assignments:", error);
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
}

  const handleDragEnd = async (event: any) => {
    // Verificar si el usuario es administrador
    if (!isUserAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden modificar las asignaciones de aulas",
        variant: "destructive",
      })
      return
    }

    const { active, over } = event

    if (!over) return

    const draggedAsignacionId = active.id.toString().split("-")[1]
    const droppedZoneId = over.id.toString()

    if (!draggedAsignacionId) return

    try {
      
      // Convertir a números
      const asignacionId = Number.parseInt(draggedAsignacionId)
      let newAulaId: number | null = null

      if (droppedZoneId.startsWith("zona-desasignar-")) {
        newAulaId = null
      } else if (droppedZoneId.startsWith("aula-")) {
        const droppedAulaId = droppedZoneId.split("-")[1]
        newAulaId = Number.parseInt(droppedAulaId)

        const draggedAsignacion = asignaciones.find((a) => a.id === asignacionId)
        if (draggedAsignacion) {
          const conflictingAsignacion = asignaciones.find(
            (a) =>
              a.aula_id === newAulaId &&
              a.dia === draggedAsignacion.dia &&
              a.id !== draggedAsignacion.id &&
              ((a.hora_inicio <= draggedAsignacion.hora_inicio && a.hora_fin > draggedAsignacion.hora_inicio) ||
                (a.hora_inicio < draggedAsignacion.hora_fin && a.hora_fin >= draggedAsignacion.hora_fin)),
          )

          if (conflictingAsignacion) {
            toast({
              title: "Error de asignación",
              description: "Esta aula ya está ocupada en este horario.",
              variant: "destructive",
            })
            return
          }
        }
      } else {
        return
      }

      // Verificar si realmente hay un cambio
      const asignacionOriginal = asignaciones.find((a) => a.id === asignacionId)
      if (asignacionOriginal && asignacionOriginal.aula_id === newAulaId) {
        // No hay cambio real, salir
        console.log("No se detectó cambio real, la asignación ya tenía esa aula")
        return
      }

      console.log(`Actualizando asignación ${asignacionId}: aula_id de ${asignacionOriginal?.aula_id} a ${newAulaId}`)

      // Mostrar indicador de carga
      setGuardando(true)

      // Actualizar en la base de datos inmediatamente
      const tables = getTableNamesByPeriod(selectedPeriod)

      // Intentar actualizar con múltiples reintentos si es necesario
      let actualizado = false
      let intentos = 0
      let error = null

      while (!actualizado && intentos < 3) {
        intentos++
        try {
          console.log(
            `Intento ${intentos} de guardar en la base de datos: asignación ${asignacionId}, aula_id=${newAulaId}`,
          )

          const { data, error: updateError } = await supabase
            .from(tables.asignaciones)
            .update({ aula_id: newAulaId })
            .eq("id", asignacionId)
            .select()

          if (updateError) {
            error = updateError
            console.error(`Error en intento ${intentos}:`, updateError)
            // Esperar antes de reintentar
            await new Promise((resolve) => setTimeout(resolve, 500))
            continue
          }

          if (data && data.length > 0) {
            console.log("Actualización exitosa:", data)
            actualizado = true

            // Actualizar el estado local con los datos de la base de datos
            setAsignaciones((prevAsignaciones) =>
              prevAsignaciones.map((asignacion) =>
                asignacion.id === asignacionId ? { ...asignacion, aula_id: newAulaId } : asignacion,
              ),
            )

            // Actualizar también las asignaciones originales para reflejar el nuevo estado
            setAsignacionesOriginales((prev) =>
              prev.map((asignacion) =>
                asignacion.id === asignacionId ? { ...asignacion, aula_id: newAulaId } : asignacion,
              ),
            )

            const aula = aulas.find((a) => a.id === newAulaId)
            toast({
              title: "Asignación guardada",
              description: newAulaId
                ? `Grupo asignado al aula ${aula?.nombre || ""} y guardado en la base de datos`
                : "Grupo movido a desasignados y guardado en la base de datos",
            })
          } else {
            console.warn("La actualización no reportó errores pero no devolvió datos", data)
            error = new Error("La actualización no devolvió datos")
          }
        } catch (e) {
          error = e
          console.error(`Error en intento ${intentos}:`, e)
        }
      }

      if (!actualizado) {
        throw error || new Error("No se pudo actualizar después de múltiples intentos")
      }
    
  }catch (error) {
      console.error("Error al actualizar asignación:", error)
      toast({
        title: "Error",
        description: "Error al actualizar la asignación en la base de datos. Por favor, intente de nuevo.",
        variant: "destructive",
      })

      // Recargar los datos para asegurar consistencia
      await fetchData()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignación de Aulas</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p>Cargando datos...</p>
          </div>
        ) : grupos.length === 0 ? (
          <>
            <Alert className="mb-4">
              <AlertTitle>No hay grupos disponibles</AlertTitle>
              <AlertDescription>
                No hay grupos disponibles para el periodo{" "}
                {selectedPeriod === "1"
                  ? "Enero-Abril"
                  : selectedPeriod === "2"
                    ? "Mayo-Agosto"
                    : "Septiembre-Diciembre"}
                .{!isUserAdmin && " Por favor, cree grupos en la sección de Gestión de Materias y Grupos primero."}
              </AlertDescription>
            </Alert>

            {/* Mostrar el botón de solicitar asignación para directores incluso cuando no hay grupos */}
            {userRole === "director" && (
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleSolicitarAsignacion}
                  disabled={solicitando}
                  className="bg-orange-web text-white hover:bg-orange-web/90"
                  showConfirmation={{
                    message: "Solicitud enviada correctamente",
                    description:
                      "Se ha enviado tu solicitud de asignación a la administración. Recibirás una notificación cuando sea procesada.",
                  }}
                >
                  {solicitando ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Enviando...
                    </>
                  ) : (
                    "Solicitar Asignación"
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <DndContext
            onDragEnd={isUserAdmin ? handleDragEnd : undefined}
            modifiers={[restrictToWindowEdges]}
            collisionDetection={closestCenter}
          >
            <div className="space-y-4">
              <Card className="bg-white dark:bg-oxford-blue">
                <CardContent className="pt-6">
                  <div className="sticky top-0 z-10 bg-white dark:bg-oxford-blue pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                      <h2 className="text-2xl font-bold text-oxford-blue dark:text-white">
                        Asignación de Aulas - Periodo{" "}
                        {selectedPeriod === "1"
                          ? "Enero-Abril"
                          : selectedPeriod === "2"
                            ? "Mayo-Agosto"
                            : "Septiembre-Diciembre"}
                      </h2>

                      {!isUserAdmin && (
                        <Alert variant="warning" className="mb-0 py-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            Modo de visualización. Solo los administradores pueden modificar las asignaciones.
                          </AlertDescription>
                        </Alert>
                      )}

                      {isUserAdmin && (
                        <div className="space-x-2 flex flex-wrap gap-2">
                          <Button
                            onClick={asignarAulas}
                            disabled={loading || guardando}
                            className="bg-orange-web text-white hover:bg-orange-web/90"
                          >
                            Asignar Aulas
                          </Button>
                          <Button
                            variant="outline"
                            onClick={deshacerAsignacion}
                            disabled={loading || guardando}
                            className="border-orange-web text-orange-web hover:bg-orange-web/10"
                          >
                            Deshacer Asignación
                          </Button>
                          {guardando && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <span className="animate-spin mr-2">⟳</span>
                              Guardando cambios...
                            </div>
                          )}
                          <Button
                            onClick={() => {
                              // Implementar exportación a Excel
                              toast({
                                title: "Exportando a Excel",
                                description: "Función en desarrollo",
                              })
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            Exportar a Excel
                          </Button>
                        </div>
                      )}
                      {/* Mostrar el botón solo si el usuario es director */}
                      {userRole === "director" && (
                        <Button
                          onClick={handleSolicitarAsignacion}
                          disabled={solicitando}
                          className="bg-orange-web text-white hover:bg-orange-web/90"
                          showConfirmation={{
                            message: "Solicitud enviada correctamente",
                            description:
                              "Se ha enviado tu solicitud de asignación a la administración. Recibirás una notificación cuando sea procesada.",
                          }}
                        >
                          {solicitando ? (
                            <>
                              <span className="animate-spin mr-2">⟳</span>
                              Enviando...
                            </>
                          ) : (
                            "Solicitar Asignación"
                          )}
                        </Button>
                      )}
                    </div>

                    {asignaciones.length === 0 && (
                      <Alert className="mb-4">
                        <AlertTitle>No hay asignaciones disponibles</AlertTitle>
                        <AlertDescription>
                          No hay asignaciones disponibles para el periodo actual. Por favor, asigne aulas a los grupos
                          primero.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Nueva alerta para cambios pendientes */}
                    {cambiosPendientes && (
                      <Alert variant="warning" className="mb-4">
                        <AlertTitle>Cambios pendientes</AlertTitle>
                        <AlertDescription>
                          Has realizado cambios en las asignaciones. Recuerda hacer clic en "Guardar Cambios" para
                          guardarlos permanentemente.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {asignaciones.length > 0 && (
                    <div className="overflow-x-auto">
                      <HorarioSemanal
                        asignaciones={asignaciones}
                        aulas={aulas}
                        materias={materias}
                        grupos={grupos}
                        isReadOnly={!isUserAdmin}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DndContext>
        )}
      </CardContent>
    </Card>
  )
}
