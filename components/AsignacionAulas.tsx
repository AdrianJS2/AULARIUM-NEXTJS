"use client"

import { featureFlags } from '@/lib/config'; // Importar feature flags
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle, AlertTriangle } from "@/components/ui/alert"
// import { isAdmin, getUserRole } from "@/lib/auth"

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
  const { user, isAdmin } = useAuth();

    const currentUserId = user?.id;
    const userCarreraId = null; // Este dato ya no se obtiene aquí.
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


 
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



  const fetchData = useCallback(async () => {
    // Usar 'user.id' directamente en lugar de un estado intermedio 'currentUserId'
    if (!selectedPeriod || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
        if (useMySqlApi) {
            const response = await fetch(`/api/asignaciones?periodoId=${selectedPeriod}&userId=${user.id}`);
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
        } 
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  }, [selectedPeriod, user?.id, useMySqlApi]); // Depender de user.id

  useEffect(() => {
    if (selectedPeriod) {
      fetchData();
    }
  }, [fetchData, selectedPeriod]);

  useEffect(() => {
    if (selectedPeriod) {
      setLoading(true)
      setRetryCount(0)
      fetchData()
    }
  }, [fetchData, selectedPeriod])

  // Configurar suscripción en tiempo real a las asignaciones
 

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
    if (!selectedPeriod || !user) {
      toast({ title: "Error", description: "Falta información del usuario o del período.", variant: "destructive" });
      return;
    }

    setSolicitando(true);
    try {
      const response = await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: 'SOLICITUD_ASIGNACION',
          periodoId: selectedPeriod,
          solicitanteId: user.id, // Se envía el ID del solicitante
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "No se pudo enviar la solicitud.");
      }
      
      toast({ title: "Solicitud Enviada", description: "Los administradores han sido notificados." });

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSolicitando(false);
    }
  };

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
  // 1. Verificación de permisos: Ahora usa 'isAdmin' del hook 'useAuth'.
  if (!isAdmin) {
      toast({
          title: "Acceso Denegado",
          description: "Solo los administradores pueden modificar las asignaciones.",
          variant: "destructive",
      });
      return;
  }

  const { active, over } = event;
  if (!over) return;

  // 2. Lógica de parseo (sin cambios): Se mantiene tu lógica para obtener los IDs.
  const draggedAsignacionId = parseInt(active.id.toString().split("-")[1], 10);
  const droppedZoneId = over.id.toString();

  if (isNaN(draggedAsignacionId)) return;

  let nuevaAulaId: number | null = null;
  if (droppedZoneId.startsWith("aula-")) {
      nuevaAulaId = parseInt(droppedZoneId.split("-")[1], 10);
  } else if (!droppedZoneId.startsWith("zona-desasignar-")) {
      return; // No se soltó en un área válida
  }

  // 3. Verificación de conflicto (sin cambios): Mantenemos esta validación en el cliente para una UX rápida.
  const asignacionArrastrada = asignaciones.find((a) => a.id === draggedAsignacionId);
  if (asignacionArrastrada && nuevaAulaId !== null) {
      const conflicto = asignaciones.find(a =>
          a.aula_id === nuevaAulaId &&
          a.dia === asignacionArrastrada.dia &&
          a.id !== asignacionArrastrada.id &&
          ((a.hora_inicio < asignacionArrastrada.hora_fin) && (a.hora_fin > asignacionArrastrada.hora_inicio))
      );

      if (conflicto) {
          toast({
              title: "Conflicto de Horario",
              description: "El aula ya está ocupada en ese horario. No se puede realizar el cambio.",
              variant: "destructive",
          });
          return;
      }
  }
  
  // 4. Verificar si realmente hay un cambio (sin cambios).
  if (asignacionArrastrada?.aula_id === nuevaAulaId) {
      console.log("No se detectó cambio real de aula.");
      return;
  }

  setGuardando(true);

  try {
      // 5. ¡LA CORRECCIÓN! Llamada a tu API en lugar de a Supabase.
      const response = await fetch('/api/asignaciones', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              asignacionId: draggedAsignacionId,
              nuevaAulaId: nuevaAulaId,
              periodoId: selectedPeriod, // Es crucial enviar el período
          }),
      });

      // Si la API responde con un error, lo lanzamos para que lo capture el 'catch'.
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "El servidor rechazó el cambio.");
      }

      // 6. Éxito: Actualización optimista del estado local.
      // Esto hace que la UI se sienta instantánea.
      setAsignaciones(prev =>
          prev.map(a =>
              a.id === draggedAsignacionId ? { ...a, aula_id: nuevaAulaId } : a
          )
      );

      // También actualizamos la copia original para la detección de cambios futuros.
       setAsignacionesOriginales(prev =>
          prev.map(a =>
              a.id === draggedAsignacionId ? { ...a, aula_id: nuevaAulaId } : a
          )
      );

      const aula = aulas.find((a) => a.id === nuevaAulaId);
      toast({
          title: "¡Guardado!",
          description: nuevaAulaId
              ? `El grupo fue movido al aula ${aula?.nombre || ''}.`
              : "El grupo fue movido a la zona de 'desasignados'.",
      });

  } catch (error: any) {
      // 7. Error: Mostramos el error y recargamos los datos para mantener la consistencia.
      console.error("Error al actualizar la asignación:", error);
      toast({
          title: "Error al Guardar",
          description: error.message,
          variant: "destructive",
      });
      
      // Si falla el guardado, es crucial recargar los datos para que la UI
      // refleje el estado real de la base de datos.
      await fetchData();
  } finally {
      setGuardando(false);
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
                .{user?.rol == "admin" && " Por favor, cree grupos en la sección de Gestión de Materias y Grupos primero."}
              </AlertDescription>
            </Alert>

            {/* Mostrar el botón de solicitar asignación para directores incluso cuando no hay grupos */}
            {user?.rol === "director" && (
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
            onDragEnd={isAdmin ? handleDragEnd : undefined}
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

                      {!isAdmin && (
                        <Alert variant="warning" className="mb-0 py-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            Modo de visualización. Solo los administradores pueden modificar las asignaciones.
                          </AlertDescription>
                        </Alert>
                      )}

                      {isAdmin && (
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
                      {user?.rol === 'director' && !isAdmin && (
                     <Button onClick={handleSolicitarAsignacion} disabled={solicitando} className="bg-orange-web text-white hover:bg-orange-web/90">
                       {solicitando ? "Enviando..." : "Solicitar Asignación"}
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
                        isReadOnly={!isAdmin}
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
