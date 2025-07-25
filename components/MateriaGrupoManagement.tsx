"use client"
import { featureFlags } from '@/lib/config';

import { useState, useEffect, useCallback } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription  } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import {
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
  Clock,
  Users,
  BookOpen,
  Calendar,
  School,
  UserCheck,
  X,
  ArrowRight,
  ArrowLeft,
  Save,
} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

import { useAuth } from "@/lib/auth";

interface Profesor {
  id: number
  nombre: string
}

interface Materia {
  id: number
  nombre: string
  profesor_id: number | null
  periodo_id: number
  carrera_id: number | null
}

interface Horario {
  dia: string
  hora_inicio: string
  hora_fin: string
}

interface Grupo {
  id: number
  materia_id: number
  numero: string
  alumnos: number
  turno: "MAÑANA" | "TARDE"
  periodo_id: number
  horarios: Horario[]
}

interface Periodo {
  id: number
  nombre: string
}

interface ConflictoHorario {
  tipo: "materia" | "profesor" | "duplicado" | "superposicion" | "disponibilidad"
  mensaje: string
  detalles: string[]
}

interface Props {
  selectedPeriod: string
}

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
const HORAS_MAÑANA = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"]
const HORAS_TARDE = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"]

const DIAS_ORDER = {
  Lunes: 0,
  Martes: 1,
  Miércoles: 2,
  Jueves: 3,
  Viernes: 4,
}

const sortHorarios = (horarios: Horario[]) => {
  return [...horarios].sort((a, b) => {
    // First sort by day
    const dayDiff = DIAS_ORDER[a.dia] - DIAS_ORDER[b.dia]
    if (dayDiff !== 0) return dayDiff

    // Then sort by start time
    return a.hora_inicio.localeCompare(b.hora_inicio)
  })
}

export default function MateriaGrupoManagement({ selectedPeriod }: Props) {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [nombreMateria, setNombreMateria] = useState("")
  const [profesorId, setProfesorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null)
  const [filterMateria, setFilterMateria] = useState("")
  const [isEditMateriaModalOpen, setIsEditMateriaModalOpen] = useState(false)
  const [isAddGrupoModalOpen, setIsAddGrupoModalOpen] = useState(false)
  const [isEditGrupoModalOpen, setIsEditGrupoModalOpen] = useState(false)
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null)
  const [selectedMateriaId, setSelectedMateriaId] = useState<number | null>(null)
  const [grupoNumero, setGrupoNumero] = useState("")
  const [grupoAlumnos, setGrupoAlumnos] = useState("")
  const [grupoTurno, setGrupoTurno] = useState<"MAÑANA" | "TARDE">("MAÑANA")
  const [filterGrupo, setFilterGrupo] = useState("")
  const [isHorarioModalOpen, setIsHorarioModalOpen] = useState(false)
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null)
  const [editingHorario, setEditingHorario] = useState<Horario | null>(null)
  const [selectedDia, setSelectedDia] = useState<string>("Lunes")
  const [selectedHoraInicio, setSelectedHoraInicio] = useState<string>("")
  const [selectedHoraFin, setSelectedHoraFin] = useState<string>("")
  const [horasClase, setHorasClase] = useState("")
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [filterByMateria, setFilterByMateria] = useState("")
  const [filterByGrupo, setFilterByGrupo] = useState("")
  const [filterByTurno, setFilterByTurno] = useState("todos")
  const [schedulesToAdd, setSchedulesToAdd] = useState<number>(0)
  const [isDeleteGrupoModalOpen, setIsDeleteGrupoModalOpen] = useState(false)
  const [grupoToDelete, setGrupoToDelete] = useState<number | null>(null)
  const [isDeleteMateriaModalOpen, setIsDeleteMateriaModalOpen] = useState(false)
  const [materiaToDelete, setMateriaToDelete] = useState<number | null>(null)
  const [isConflictoModalOpen, setIsConflictoModalOpen] = useState(false)
  const [conflictoHorario, setConflictoHorario] = useState<ConflictoHorario | null>(null)
  const [isDuplicadoModalOpen, setIsDuplicadoModalOpen] = useState(false)
  const [mensajeDuplicado, setMensajeDuplicado] = useState("")
  

  const [carreraNombre, setCarreraNombre] = useState<string | null>(null)

 
  const [loading, setLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState("info")
  const [isValidatingHorario, setIsValidatingHorario] = useState(false)
  const [profesoresLoaded, setProfesoresLoaded] = useState(false)
  const { user, loading: authLoading } = useAuth();
  const useMySqlApi = featureFlags.materiasGrupos === 'mysql';
  const [dataLoading, setDataLoading] = useState(true);

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

  // Función para crear asignaciones automáticas
  // const crearAsignacionesAutomaticas = async (nuevoGrupo: any, materiaId: number) => {
  //   if (!selectedPeriod) return

  //   const tables = getTableNamesByPeriod(selectedPeriod)

  //   try {
  //     // Obtener aulas disponibles
  //     const { data: aulas, error: aulasError } = await supabase.from("aulas").select("*")

  //     if (aulasError) throw aulasError

  //     // Obtener todas las asignaciones existentes
  //     const { data: asignacionesExistentes, error: asignacionesError } = await supabase
  //       .from(tables.asignaciones)
  //       .select("*")

  //     if (asignacionesError) throw asignacionesError

  //     // Crear asignaciones para cada horario del grupo
  //     const nuevasAsignaciones = []

  //     for (const horario of nuevoGrupo.horarios) {
  //       // Buscar un aula disponible para este horario
  //       const aulaDisponible = aulas.find((aula) => {
  //         // Verificar si el aula tiene capacidad suficiente
  //         if (aula.capacidad < nuevoGrupo.alumnos) return false

  //         // Verificar si el aula ya está ocupada en este horario
  //         return !asignacionesExistentes.some(
  //           (asignacion) =>
  //             asignacion.aula_id === aula.id &&
  //             asignacion.dia === horario.dia &&
  //             asignacion.turno === nuevoGrupo.turno &&
  //             ((asignacion.hora_inicio <= horario.hora_inicio && asignacion.hora_fin > horario.hora_inicio) ||
  //               (asignacion.hora_inicio < horario.hora_fin && asignacion.hora_fin >= horario.hora_fin)),
  //         )
  //       })

  //       // Crear la asignación (con o sin aula)
  //       nuevasAsignaciones.push({
  //         grupo_id: nuevoGrupo.id,
  //         aula_id: aulaDisponible?.id || null,
  //         materia_id: materiaId,
  //         dia: horario.dia,
  //         hora_inicio: horario.hora_inicio,
  //         hora_fin: horario.hora_fin,
  //         turno: nuevoGrupo.turno,
  //         periodo_id: Number(selectedPeriod),
  //         carrera_id: userCarreraId,
  //       })
  //     }

  //     // Insertar las nuevas asignaciones
  //     if (nuevasAsignaciones.length > 0) {
  //       const { error: insertError } = await supabase.from(tables.asignaciones).insert(nuevasAsignaciones)

  //       if (insertError) throw insertError

  //       console.log(`Creadas ${nuevasAsignaciones.length} asignaciones automáticas para el grupo ${nuevoGrupo.numero}`)
  //     }
  //   } catch (error) {
  //     console.error("Error al crear asignaciones automáticas:", error)
  //   }
  // }

  // Función para cargar todos los profesores directamente
//   const loadAllProfesores = async () => {
//     try {
//         setLoading(true);
//         console.log("Cargando TODOS los profesores desde la API de MySQL...");

//         // Usamos fetch para llamar a nuestra API en lugar de Supabase.
//         const response = await fetch('/api/profesores');
//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.error || 'Error al cargar profesores desde la API');
//         }
        
//         const data = await response.json();

//         console.log(`Profesores cargados: ${data?.length || 0}`);
//         setProfesores(data || []);
//         setProfesoresLoaded(true);
//     } catch (error) {
//         console.error("Error en loadAllProfesores:", error);
//         setError("Error al cargar los profesores: " + (error instanceof Error ? error.message : String(error)));
//     } finally {
//         setLoading(false);
//     }
// };

  // Función para cargar profesores independientemente de las materias
//   const fetchProfesores = useCallback(async () => {
//     // Si no tenemos la información necesaria, no hacemos nada.
//     if (!currentUserId) return;

//     setLoading(true);
//     console.log(`Cargando profesores desde la API con rol: ${userRole}`);

//     try {
//         // Hacemos una única llamada a nuestra API inteligente, pasándole el rol y el ID del usuario.
//         const response = await fetch(`/api/profesores?userId=${currentUserId}&userRole=${userRole}`);

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.error || 'No se pudieron cargar los profesores desde la API.');
//         }

//         const data = await response.json();
        
//         setProfesores(data || []);
//         setProfesoresLoaded(true);
//     } catch (error) {
//         console.error("Error fetching profesores:", error);
//         setError("Error al cargar los profesores: " + (error instanceof Error ? error.message : String(error)));
//     } finally {
//         setLoading(false);
//     }
// }, [currentUserId, userRole]); // Las dependencias ahora son más limpias.

  // Modify the fetchData function to properly filter materials based on user role
  const fetchData = useCallback(async () => {
    if (authLoading || !user || !selectedPeriod) {
      return;
    }
    setDataLoading(true);
    setError(null);
    try {
      if (useMySqlApi) {
        const [materiasGruposRes, profesoresRes] = await Promise.all([
          fetch(`/api/materias-grupos?periodoId=${selectedPeriod}`),
          fetch('/api/profesores')
        ]);
        if (!materiasGruposRes.ok) throw new Error((await materiasGruposRes.json()).error || 'Error al cargar datos.');
        if (!profesoresRes.ok) throw new Error((await profesoresRes.json()).error || 'Error al cargar profesores.');
        
        const materiasGruposData = await materiasGruposRes.json();
        const profesoresData = await profesoresRes.json();
        
        setMaterias(materiasGruposData.materias || []);
        setGrupos((materiasGruposData.grupos || []).map((g: any) => ({ ...g, horarios: Array.isArray(g.horarios) ? g.horarios : JSON.parse(g.horarios || "[]") })));
        setProfesores(profesoresData || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDataLoading(false);
    }
  }, [selectedPeriod, user, authLoading, useMySqlApi]);

  useEffect(() => {
    if (!authLoading && user) {
        fetchData();
    }
  }, [authLoading, user, fetchData]);

  // ✅ PASO 3: Simplificar el useEffect para que dependa del estado de carga de la autenticación
  useEffect(() => {
    if (!authLoading && user) {
        fetchData();
    }
  }, [authLoading, user, fetchData]); 

  // Función para verificar si el usuario es administrador directamente desde la API
  // const checkAdminStatus = async (userId: string) => {
  //   try {
  //     const response = await fetch(`/api/check-admin?userId=${userId}`)
  //     const data = await response.json()
  //     console.log("Respuesta de check-admin API:", data)
  //     return data.isAdmin === true
  //   } catch (error) {
  //     console.error("Error verificando estado de admin:", error)
  //     return false
  //   }
  // }

  // useEffect(() => {
  //   async function fetchUserData() {
  //     try {
  //       const {
  //         data: { user },
  //       } = await supabase.auth.getUser()

  //       if (user) {
  //         setCurrentUserId(user.id)

  //         // Verificar si es admin directamente desde la API
  //         const adminStatus = await checkAdminStatus(user.id)
  //         console.log("Estado de admin desde API:", adminStatus)
  //         setIsUserAdmin(adminStatus)

  //         // También obtener el rol para otros usos
  //         const { rol, carrera_id, carrera_nombre } = await getUserRole(user.id)
  //         setUserRole(rol)
  //         setUserCarreraId(carrera_id)
  //         setCarreraNombre(carrera_nombre)

  //         // Si es admin, cargar todos los profesores inmediatamente
  //         if (adminStatus) {
  //           console.log("Usuario es admin, cargando todos los profesores...")
  //           await loadAllProfesores()
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error obteniendo datos del usuario:", error)
  //     }
  //   }

  //   fetchUserData()
  // }, [])

  // Cargar profesores inmediatamente después de obtener el rol del usuario
  // useEffect(() => {
  //   if (currentUserId !== null && userRole !== null && !profesoresLoaded) {
  //     console.log("Cargando profesores después de obtener el rol del usuario")
  //     if (userRole === "admin" || isUserAdmin) {
  //       loadAllProfesores()
  //     } else {
  //       fetchProfesores()
  //     }
  //   }
  // }, [currentUserId, userRole, profesoresLoaded, fetchProfesores, isUserAdmin])

  // useEffect(() => {
  //   if (selectedPeriod && currentUserId !== null) {
  //     fetchData()
  //   }
  // }, [fetchData, selectedPeriod, currentUserId])

  async function addMateria() {
    if (!nombreMateria.trim() || !profesorId) {
        toast({ title: "Error", description: "Todos los campos son requeridos.", variant: "destructive" });
        return;
    }

    // ✅ 6. LA VALIDACIÓN CLAVE, AHORA MÁS FIABLE QUE NUNCA
    // Esta comprobación se hace sobre el objeto `user` del contexto, que es la única fuente de verdad.
    if (!user) {
      toast({
          title: "Error de Sesión",
          description: "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.",
          variant: "destructive"
      });
      return;
  }
  
  if (!user.carrera_id) {
      toast({
          title: "Acción no permitida",
          description: "Tu usuario no tiene una carrera asignada. Contacta a un administrador.",
          variant: "destructive"
      });
      return;
  }

    setLoading(true);
    const materiaData = {
        nombre: nombreMateria,
        profesor_id: profesorId === "pendiente" ? null : parseInt(profesorId),
        carrera_id: user.carrera_id, // Usamos la carrera del usuario del hook.
        usuario_id: user.id          // Usamos el ID del usuario del hook.
    };

    try {
        if (useMySqlApi) {
            const response = await fetch('/api/materias-grupos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'materia', payload: materiaData, periodoId: selectedPeriod }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear la materia vía API');
            }
        } 

        await fetchData();
        setNombreMateria("");
        setProfesorId(null);
        toast({ title: "Éxito", description: "Materia creada correctamente." });
    } catch (err) {
        setError((err as Error).message);
        toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
}
async function updateMateria() {
  if (!editingMateria) return;
  if (!nombreMateria.trim()) {
      toast({ title: "Error", description: "El nombre de la materia es requerido.", variant: "destructive" });
      return;
  }
  
  setLoading(true);
  const updatedMateriaData = {
      id: editingMateria.id,
      nombre: nombreMateria,
      profesor_id: profesorId === "pendiente" ? null : Number.parseInt(profesorId!),
  };
  
  try {
      // HE AQUÍ LA CORRECCIÓN: Se añade el if/else para usar la API o Supabase.
      if (useMySqlApi) {
          const response = await fetch('/api/materias-grupos', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'materia', payload: updatedMateriaData, periodoId: selectedPeriod }),
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Error al actualizar la materia vía API.');
          }
      } else {
          const { error } = await supabase
              .from(getTableNamesByPeriod(selectedPeriod).materias)
              .update({ nombre: updatedMateriaData.nombre, profesor_id: updatedMateriaData.profesor_id })
              .eq("id", updatedMateriaData.id);
          if (error) throw error;
      }

      await fetchData();
      setIsEditMateriaModalOpen(false);
      toast({ title: "Éxito", description: "Materia actualizada." });

  } catch (err) {
      setError((err as Error).message);
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
  } finally {
      setLoading(false);
  }
}


  const confirmDeleteMateria = (id: number) => {
    setMateriaToDelete(id)
    setIsDeleteMateriaModalOpen(true)
  }


  const handleEditMateria = (materia: Materia) => {
    setEditingMateria(materia)
    setNombreMateria(materia.nombre)
    setProfesorId(materia.profesor_id ? materia.profesor_id.toString() : "pendiente")
    setIsEditMateriaModalOpen(true)
  }

  // Modificar la función verificarConflictos para incluir la verificación de disponibilidad del profesor
  // Buscar la función verificarConflictos y reemplazarla con esta versión mejorada:

  const verificarConflictos = async (
    nuevoHorario: Horario,
    grupoEditandoId?: number,
  ): Promise<ConflictoHorario | null> => {
    // Si estamos editando, usamos la materia del grupo que se está editando
    const materiaId = editingGrupo ? editingGrupo.materia_id : selectedMateriaId

    if (!materiaId) return null

    const materiaSeleccionada = materias.find((m) => m.id === materiaId)
    if (!materiaSeleccionada) return null

    const profesorSeleccionado = materiaSeleccionada.profesor_id

    // Verificar conflictos con la misma materia
    const gruposConMismaMateria = grupos.filter(
      (g) =>
        g.materia_id === materiaId &&
        // Excluir el grupo que estamos editando
        (grupoEditandoId === undefined || g.id !== grupoEditandoId),
    )

    const conflictosMateria: string[] = []

    for (const grupo of gruposConMismaMateria) {
      for (const horarioExistente of grupo.horarios) {
        if (
          horarioExistente.dia === nuevoHorario.dia &&
          ((horarioExistente.hora_inicio <= nuevoHorario.hora_inicio &&
            horarioExistente.hora_fin > nuevoHorario.hora_inicio) ||
            (horarioExistente.hora_inicio < nuevoHorario.hora_fin &&
              horarioExistente.hora_fin >= nuevoHorario.hora_fin) ||
            (nuevoHorario.hora_inicio <= horarioExistente.hora_inicio &&
              nuevoHorario.hora_fin > horarioExistente.hora_inicio))
        ) {
          conflictosMateria.push(
            `Grupo ${grupo.numero}: ${horarioExistente.dia} ${horarioExistente.hora_inicio} - ${horarioExistente.hora_fin}`,
          )
        }
      }
    }
    

    if (conflictosMateria.length > 0) {
      return {
        tipo: "materia",
        mensaje: `La materia "${materiaSeleccionada.nombre}" ya tiene clases programadas en este horario.`,
        detalles: conflictosMateria,
      }
    }

    // Verificar conflictos con el mismo profesor
    if (profesorSeleccionado) {
      // Obtener todas las materias del profesor
      const materiasDelProfesor = materias.filter((m) => m.profesor_id === profesorSeleccionado)

      // Obtener todos los grupos de esas materias, excluyendo el grupo que estamos editando
      const gruposDelProfesor = grupos.filter(
        (g) =>
          materiasDelProfesor.some((m) => m.id === g.materia_id) &&
          (grupoEditandoId === undefined || g.id !== grupoEditandoId),
      )

      const conflictosProfesor: string[] = []

      for (const grupo of gruposDelProfesor) {
        const materiaDelGrupo = materias.find((m) => m.id === grupo.materia_id)
        if (!materiaDelGrupo) continue

        for (const horarioExistente of grupo.horarios) {
          if (
            horarioExistente.dia === nuevoHorario.dia &&
            ((horarioExistente.hora_inicio <= nuevoHorario.hora_inicio &&
              horarioExistente.hora_fin > nuevoHorario.hora_inicio) ||
              (horarioExistente.hora_inicio < nuevoHorario.hora_fin &&
                horarioExistente.hora_fin >= nuevoHorario.hora_fin) ||
              (nuevoHorario.hora_inicio <= horarioExistente.hora_inicio &&
                nuevoHorario.hora_fin > horarioExistente.hora_inicio))
          ) {
            conflictosProfesor.push(
              `Materia "${materiaDelGrupo.nombre}", Grupo ${grupo.numero}: ${horarioExistente.dia} ${horarioExistente.hora_inicio} - ${horarioExistente.hora_fin}`,
            )
          }
        }
      }

      if (conflictosProfesor.length > 0) {
        const profesor = profesores.find((p) => p.id === profesorSeleccionado)
        return {
          tipo: "profesor",
          mensaje: `El profesor "${profesor?.nombre}" ya tiene clases programadas en este horario.`,
          detalles: conflictosProfesor,
        }
      }

      try {
        
        const response = await fetch(`/api/profesores/disponibilidad?id=${profesorSeleccionado}`);

        if (!response.ok) {
            if (response.status === 404) {
                // Si la API dice que no encuentra al profesor, lo manejamos.
                throw new Error(`El profesor con ID ${profesorSeleccionado} no fue encontrado en la base de datos de MySQL.`);
            }
            // Cualquier otro error de la API.
            throw new Error('No se pudo obtener la disponibilidad del profesor desde la API.');
        }
        
        const profesorData = await response.json();

        if (profesorData && profesorData.disponibilidad) {
            const disponibilidad = profesorData.disponibilidad;
            const dia = nuevoHorario.dia;

            if (!disponibilidad[dia]) {
                const profesor = profesores.find((p) => p.id === profesorSeleccionado);
                return {
                    tipo: "disponibilidad",
                    mensaje: `El profesor "${profesor?.nombre}" no tiene configurada la disponibilidad para ${dia}.`,
                    detalles: [`No hay configuración de disponibilidad para ${dia}.`],
                };
            }

            const horaInicio = Number.parseInt(nuevoHorario.hora_inicio.split(":")[0]);
            const horaFin = Number.parseInt(nuevoHorario.hora_fin.split(":")[0]);
            const horasNoDisponibles = [];

            for (let hora = horaInicio; hora < horaFin; hora++) {
                const horaFormateada = `${hora.toString().padStart(2, "0")}:00`;
                if (disponibilidad[dia][horaFormateada] !== true) {
                    horasNoDisponibles.push(horaFormateada);
                }
            }

            if (horasNoDisponibles.length > 0) {
                const profesor = profesores.find((p) => p.id === profesorSeleccionado);
                return {
                    tipo: "disponibilidad",
                    mensaje: `El profesor "${profesor?.nombre}" no está disponible en todas las horas requeridas.`,
                    detalles: [
                        `El horario requiere disponibilidad de ${nuevoHorario.hora_inicio} a ${nuevoHorario.hora_fin}`,
                        `Horas no disponibles: ${horasNoDisponibles.join(", ")}`,
                    ],
                };
            }
        }
    } 
      // Verificar disponibilidad del profesor para todo el rango de horas
      catch (error) {
        // Ahora el error que se muestra en consola será mucho más claro.
        console.error("Error al verificar disponibilidad del profesor:", error);
        toast({
            title: "Error de Disponibilidad",
            description: (error as Error).message,
            variant: "destructive"
        });
        // Es buena idea devolver un conflicto para que la operación se detenga.
        return {
            tipo: 'disponibilidad',
            mensaje: 'No se pudo verificar la disponibilidad del profesor.',
            detalles: [(error as Error).message]
        }
    }
}

return null;
};

  // Verificar si un horario está duplicado
  const verificarHorarioDuplicado = (nuevoHorario: Horario): ConflictoHorario | null => {
    const horarioDuplicado = horarios.some(
      (h) =>
        h.dia === nuevoHorario.dia &&
        h.hora_inicio === nuevoHorario.hora_inicio &&
        h.hora_fin === nuevoHorario.hora_fin,
    )

    if (horarioDuplicado) {
      return {
        tipo: "duplicado",
        mensaje: "No se puede agregar un horario duplicado",
        detalles: [
          `Ya existe un horario para ${nuevoHorario.dia} de ${nuevoHorario.hora_inicio} a ${nuevoHorario.hora_fin}`,
        ],
      }
    }

    return null
  }

  // Verificar si un horario se superpone con otros
  const verificarHorarioSuperpuesto = (nuevoHorario: Horario): ConflictoHorario | null => {
    const horariosSuperpuestos = horarios.filter((h) => {
      if (h.dia !== nuevoHorario.dia) return false

      // Verificar si el nuevo horario se superpone con un horario existente
      return (
        (nuevoHorario.hora_inicio >= h.hora_inicio && nuevoHorario.hora_inicio < h.hora_fin) || // Inicio dentro de otro horario
        (nuevoHorario.hora_fin > h.hora_inicio && nuevoHorario.hora_fin <= h.hora_fin) || // Fin dentro de otro horario
        (nuevoHorario.hora_inicio <= h.hora_inicio && nuevoHorario.hora_fin >= h.hora_fin) // El nuevo horario contiene completamente al existente
      )
    })

    if (horariosSuperpuestos.length > 0) {
      return {
        tipo: "superposicion",
        mensaje: "El horario se superpone con otro horario existente",
        detalles: horariosSuperpuestos.map((h) => `Horario existente: ${h.dia} de ${h.hora_inicio} a ${h.hora_fin}`),
      }
    }

    return null
  }

  // Modificar la función handleAddHorario para usar el modal de conflicto en lugar de toast
  const handleAddHorario = async () => {
    if (!selectedDia || !selectedHoraInicio || !selectedHoraFin) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos del horario",
        variant: "destructive",
      })
      return
    }

    // Validar que la hora de fin sea posterior a la hora de inicio
    if (selectedHoraInicio >= selectedHoraFin) {
      toast({
        title: "Error",
        description: "La hora de fin debe ser posterior a la hora de inicio",
        variant: "destructive",
      })
      return
    }

    const nuevoHorario: Horario = {
      dia: selectedDia,
      hora_inicio: selectedHoraInicio,
      hora_fin: selectedHoraFin,
    }

    setIsValidatingHorario(true)

    // Verificar si ya existe un horario idéntico
    const conflictoDuplicado = verificarHorarioDuplicado(nuevoHorario)
    if (conflictoDuplicado) {
      setConflictoHorario(conflictoDuplicado)
      setIsConflictoModalOpen(true)
      setIsValidatingHorario(false)
      return
    }

    // Verificar si hay superposición con otros horarios del mismo día
    const conflictoSuperposicion = verificarHorarioSuperpuesto(nuevoHorario)
    if (conflictoSuperposicion) {
      setConflictoHorario(conflictoSuperposicion)
      setIsConflictoModalOpen(true)
      setIsValidatingHorario(false)
      return
    }

    try {
      // Verificar conflictos antes de agregar el horario
      const conflicto = await verificarConflictos(nuevoHorario, editingGrupo?.id)
      if (conflicto) {
        setConflictoHorario(conflicto)
        setIsConflictoModalOpen(true)
        setIsValidatingHorario(false)
        return
      }

      setHorarios([...horarios, nuevoHorario])
      setSelectedDia("Lunes")
      setSelectedHoraInicio("")
      setSelectedHoraFin("")
    } catch (error) {
      console.error("Error al verificar conflictos:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al verificar conflictos de horario",
        variant: "destructive",
      })
    } finally {
      setIsValidatingHorario(false)
    }
  }

  const handleRemoveHorario = (index: number) => {
    setHorarios(horarios.filter((_, i) => i !== index))
  }
  //Añadir grupo

  async function addGrupo() {
    // 1. La validación de campos se mantiene igual.
    if (!selectedMateriaId || !selectedPeriod || !grupoNumero || !grupoAlumnos || !grupoTurno || horarios.length === 0) {
        toast({
            title: "Error",
            description: "Por favor complete todos los campos y agregue al menos un horario",
            variant: "destructive",
        });
        return;
    }

    setLoading(true);
    setError(null);

    try {
        // 2. La verificación de conflictos en el frontend se mantiene para dar feedback rápido.
        for (const horario of horarios) {
            const conflicto = await verificarConflictos(horario);
            if (conflicto) {
                setConflictoHorario(conflicto);
                setIsConflictoModalOpen(true);
                setLoading(false); // Detener la carga si hay conflicto
                return;
            }
        }

        // 3. Preparamos el payload (los datos a enviar).
        const grupoData = {
            materia_id: selectedMateriaId,
            numero: grupoNumero,
            alumnos: Number.parseInt(grupoAlumnos),
            turno: grupoTurno,
            horarios: horarios,
        };

        // 4. HE AQUÍ EL CAMBIO: Usamos la API si el flag está activo.
        if (useMySqlApi) {
            const response = await fetch('/api/materias-grupos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'grupo', payload: grupoData, periodoId: selectedPeriod }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al agregar el grupo vía API.');
            }
        } else {
            // Lógica de Supabase como fallback.
            // NOTA: La función crearAsignacionesAutomaticas ya no se llama aquí.
            const tables = getTableNamesByPeriod(selectedPeriod);
            const { error } = await supabase.from(tables.grupos).insert([grupoData]);
            if (error) throw error;
        }

        // 5. Lógica de éxito: se recargan los datos y se limpia el formulario.
        await fetchData();
        setGrupoNumero("");
        setGrupoAlumnos("");
        setGrupoTurno("MAÑANA");
        setHorasClase("");
        setHorarios([]);
        setSelectedMateriaId(null);
        toast({
            title: "Éxito",
            description: "Grupo y sus horarios base han sido agregados correctamente.",
        });

    } catch (error) {
        console.error("Error al agregar grupo:", error);
        toast({
            title: "Error",
            description: "Ocurrió un error al agregar el grupo: " + (error as Error).message,
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
}
 
async function updateGrupo() {
  if (!editingGrupo) return;
  setLoading(true);
  const updatedGrupoData = {
      id: editingGrupo.id,
      numero: grupoNumero,
      alumnos: Number.parseInt(grupoAlumnos),
      turno: grupoTurno,
      horarios: horarios,
      materia_id: editingGrupo.materia_id,
  };
  try {
      // HE AQUÍ LA CORRECCIÓN: Se añade el if/else para usar la API o Supabase.
      if (useMySqlApi) {
           const response = await fetch('/api/materias-grupos', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'grupo', payload: updatedGrupoData, periodoId: selectedPeriod }),
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Error al actualizar el grupo vía API.');
          }
      } else {
          const tables = getTableNamesByPeriod(selectedPeriod);
          const { error } = await supabase.from(tables.grupos).update(updatedGrupoData).eq("id", editingGrupo.id);
          if (error) throw error;
      }
      await fetchData();
      setIsEditGrupoModalOpen(false);
      toast({ title: "Éxito", description: "Grupo actualizado." });
  } catch (err) {
      setError((err as Error).message);
  } finally {
      setLoading(false);
  }
}

  const confirmDeleteGrupo = (id: number) => {
    setGrupoToDelete(id)
    setIsDeleteGrupoModalOpen(true)
  }
  
 
  async function executeDeleteGrupo() {
    if (!grupoToDelete || !selectedPeriod) return;

    // HE AQUÍ LA CORRECCIÓN: Se activa el estado de carga y se limpia cualquier error previo.
    setLoading(true);
    setError(null);

    try {
        // HE AQUÍ LA CORRECCIÓN: Verificamos el feature flag para decidir qué lógica usar.
        if (useMySqlApi) {
            // Si el flag de MySQL está activo, llamamos a nuestra API.
            const response = await fetch(
                `/api/materias-grupos?id=${grupoToDelete}&type=grupo&periodoId=${selectedPeriod}`, 
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                // Lanza un error para que sea capturado por el bloque catch.
                throw new Error(errorData.error || 'Error al eliminar el grupo vía API.');
            }
        } else {
            // Lógica original de Supabase (se mantiene como fallback).
            const tables = getTableNamesByPeriod(selectedPeriod);
            
            // Primero, eliminar las asignaciones asociadas.
            const { error: asignacionesError } = await supabase
                .from(tables.asignaciones)
                .delete()
                .eq("grupo_id", grupoToDelete);

            if (asignacionesError) throw asignacionesError;

            // Luego, eliminar el grupo.
            const { error: grupoError } = await supabase
                .from(tables.grupos)
                .delete()
                .eq("id", grupoToDelete);

            if (grupoError) throw grupoError;
        }

        // La lógica de éxito se ejecuta sin importar el método (API o Supabase).
        await fetchData(); // Recargamos los datos para reflejar la eliminación.
        setIsDeleteGrupoModalOpen(false);
        setGrupoToDelete(null);
        toast({
            title: "Éxito",
            description: "Grupo eliminado correctamente.",
        });

    } catch (err) {
        // Manejo de errores unificado.
        const message = err instanceof Error ? err.message : "Error al eliminar el grupo.";
        console.error("Error deleting grupo:", err);
        setError(message);
        toast({
            title: "Error de Eliminación",
            description: message,
            variant: "destructive",
        });
    } finally {
        // Nos aseguramos de desactivar el estado de carga.
        setLoading(false);
    }
}

async function executeDeleteMateria() {
  if (!materiaToDelete) return;
  setLoading(true);
  try {
      // HE AQUÍ LA CORRECCIÓN: Se añade el if/else para usar la API o Supabase.
      if (useMySqlApi) {
          const response = await fetch(`/api/materias-grupos?id=${materiaToDelete}&type=materia&periodoId=${selectedPeriod}`, {
              method: 'DELETE',
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Error al eliminar vía API');
          }
      } else {
          const tables = getTableNamesByPeriod(selectedPeriod);
          const { data: gruposData } = await supabase.from(tables.grupos).select("id").eq("materia_id", materiaToDelete);
          if (gruposData && gruposData.length > 0) {
              const grupoIds = gruposData.map(g => g.id);
              await supabase.from(tables.asignaciones).delete().in("grupo_id", grupoIds);
          }
          await supabase.from(tables.grupos).delete().eq("materia_id", materiaToDelete);
          await supabase.from(tables.materias).delete().eq("id", materiaToDelete);
      }
      fetchData();
      toast({ title: "Éxito", description: "Materia eliminada." });
  } catch (err) {
      setError((err as Error).message);
  } finally {
      setIsDeleteMateriaModalOpen(false);
      setLoading(false);
  }
}
  // Modificar la función handleEditGrupo para incluir el número de horas de clase
  const handleEditGrupo = (grupo: Grupo) => {
    setEditingGrupo(grupo)
    setGrupoNumero(grupo.numero)
    setGrupoAlumnos(grupo.alumnos.toString())
    setGrupoTurno(grupo.turno)
    setHorarios(grupo.horarios || [])
    setSchedulesToAdd(grupo.horarios?.length || 0)
    setHorasClase(grupo.horarios?.length.toString() || "0")
    setActiveTab("info")
    setIsEditGrupoModalOpen(true)
  }

  const updateGrupoHorarios = async (grupoId: number, horarios: Horario[]) => {
    if (!selectedPeriod) return

    const tables = getTableNamesByPeriod(selectedPeriod)

    const { error } = await supabase.from(tables.grupos).update({ horarios }).eq("id", grupoId)

    if (error) {
      console.error("Error updating horarios:", error)
      toast({
        title: "Error",
        description: "Error al actualizar los horarios",
        variant: "destructive",
      })
    } else {
      fetchData()
      toast({
        title: "Éxito",
        description: "Horarios actualizados correctamente",
      })
    }
  }

  const columnsMaterias: ColumnDef<Materia>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      accessorKey: "profesor_id",
      header: "Profesor",
      cell: ({ row }) => {
        const profesorId = row.original.profesor_id
        const profesor = profesores.find((p) => p.id === profesorId)
        return profesor ? profesor.nombre : "Pendiente por asignar"
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const materia = row.original


        if (authLoading || dataLoading) {
          return (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          );
        }
        return (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleEditMateria(materia)}>
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => confirmDeleteMateria(materia.id)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
          </div>
        )
      },
    },
  ]

  const filteredMaterias = materias.filter((materia) =>
    materia.nombre.toLowerCase().includes(filterMateria.toLowerCase()),
  )

  const handleHorasClaseChange = (value: string) => {
    setHorasClase(value) // Siempre actualizar el valor del input

    if (value === "") {
      // Si el campo está vacío, resetear el número de horarios
      setSchedulesToAdd(0)
      setHorarios([])
      return
    }

    const hours = Number.parseInt(value)
    if (!isNaN(hours) && hours > 0) {
      setSchedulesToAdd(hours)
      // Clear existing schedules when hours change
      setHorarios([])
    }
  }

  const filteredGrupos = grupos.filter((grupo) => {
    const materia = materias.find((m) => m.id === grupo.materia_id)
    const matchesMateria = filterByMateria
      ? materia?.nombre.toLowerCase().includes(filterByMateria.toLowerCase())
      : true
    const matchesGrupo = filterByGrupo ? grupo.numero.toLowerCase().includes(filterByGrupo.toLowerCase()) : true
    const matchesTurno = filterByTurno !== "todos" ? grupo.turno === filterByTurno : true

    return matchesMateria && matchesGrupo && matchesTurno
  })

  // Group the grupos by numero
  const groupedGrupos = filteredGrupos.reduce(
    (acc, grupo) => {
      if (!acc[grupo.numero]) {
        acc[grupo.numero] = []
      }
      acc[grupo.numero].push(grupo)
      return acc
    },
    {} as Record<string, typeof filteredGrupos>,
  )

  const handleDeleteHorario = async (grupoId: number, index: number) => {
    const grupo = grupos.find((g) => g.id === grupoId)
    if (!grupo) return

    const updatedHorarios = [...grupo.horarios]
    updatedHorarios.splice(index, 1)

    await updateGrupoHorarios(grupoId, updatedHorarios)
  }

  // Obtener el nombre de la materia para el grupo que se está editando
  const getEditingMateriaName = () => {
    if (!editingGrupo) return ""
    const materia = materias.find((m) => m.id === editingGrupo.materia_id)
    return materia?.nombre || ""
  }

  // Obtener el nombre del profesor para el grupo que se está editando
  const getEditingProfesorName = () => {
    if (!editingGrupo) return ""
    const materia = materias.find((m) => m.id === editingGrupo.materia_id)
    if (!materia || !materia.profesor_id) return "Pendiente por asignar"
    const profesor = profesores.find((p) => p.id === materia.profesor_id)
    return profesor?.nombre || "Pendiente por asignar"
  }

  // Reemplazar el Dialog de edición de grupo con esta versión mejorada
  // Buscar el Dialog con open={isEditGrupoModalOpen} y reemplazarlo con esta versión:

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-primary">Gestión de Materias y Grupos</h2>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Nueva Materia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="nombre" className="text-sm font-medium text-muted-foreground">
                    Nombre de la materia
                  </label>
                  <Input
                    id="nombre"
                    placeholder="Nombre de la materia"
                    value={nombreMateria}
                    onChange={(e) => setNombreMateria(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profesor" className="text-sm font-medium text-muted-foreground">
                    Profesor
                  </label>
                  <Select value={profesorId || ""} onValueChange={setProfesorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente por asignar</SelectItem>
                      {profesores.map((profesor) => (
                        <SelectItem key={profesor.id} value={profesor.id.toString()}>
                          {profesor.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end space-x-2">
                  <Button onClick={addMateria} className="flex-1">
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Materias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Buscar materias..."
                  value={filterMateria}
                  onChange={(e) => setFilterMateria(e.target.value)}
                  className="max-w-sm"
                />
                <div className="rounded-md border">
                  <DataTable columns={columnsMaterias} data={filteredMaterias} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-oxford-blue dark:text-white">Agregar Nuevo Grupo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="materia" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Materia
                  </Label>
                  <Select
                    value={selectedMateriaId?.toString() || ""}
                    onValueChange={(value) => setSelectedMateriaId(Number(value))}
                  >
                    <SelectTrigger id="materia" className="bg-transparent border-gray-300 dark:border-gray-700">
                      <SelectValue placeholder="Seleccionar Materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {materias.map((materia) => (
                        <SelectItem key={materia.id} value={materia.id.toString()}>
                          {materia.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grupo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Grupo
                  </Label>
                  <Input
                    id="grupo"
                    className="bg-transparent border-gray-300 dark:border-gray-700"
                    value={grupoNumero}
                    onChange={(e) => setGrupoNumero(e.target.value)}
                    placeholder="Ej: 01AM"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alumnos" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cantidad de alumnos
                  </Label>
                  <Input
                    id="alumnos"
                    type="number"
                    className="bg-transparent border-gray-300 dark:border-gray-700"
                    value={grupoAlumnos}
                    onChange={(e) => setGrupoAlumnos(e.target.value)}
                    placeholder="Ej: 30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turno" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Turno
                  </Label>
                  <Select value={grupoTurno} onValueChange={(value: "MAÑANA" | "TARDE") => setGrupoTurno(value)}>
                    <SelectTrigger id="turno" className="bg-transparent border-gray-300 dark:border-gray-700">
                      <SelectValue placeholder="Seleccionar turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAÑANA">Mañana</SelectItem>
                      <SelectItem value="TARDE">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horas" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Horas de clase
                  </Label>
                  <Input
                    id="horas"
                    type="number"
                    className="bg-transparent border-gray-300 dark:border-gray-700"
                    value={horasClase}
                    onChange={(e) => handleHorasClaseChange(e.target.value)}
                    min="1"
                    max="10"
                    placeholder="Ej: 3"
                  />
                </div>
              </div>

              {schedulesToAdd > 0 && (
                <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-white/20">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Configuración de Horarios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dia" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Día
                      </Label>
                      <Select value={selectedDia} onValueChange={setSelectedDia}>
                        <SelectTrigger id="dia" className="bg-transparent border-gray-300 dark:border-gray-700">
                          <SelectValue placeholder="Seleccionar día" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIAS.map((dia) => (
                            <SelectItem key={dia} value={dia}>
                              {dia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hora-inicio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Hora inicio
                      </Label>
                      <Select value={selectedHoraInicio} onValueChange={setSelectedHoraInicio}>
                        <SelectTrigger id="hora-inicio" className="bg-transparent border-gray-300 dark:border-gray-700">
                          <SelectValue placeholder="Seleccionar hora" />
                        </SelectTrigger>
                        <SelectContent>
                          {(grupoTurno === "MAÑANA" ? HORAS_MAÑANA : HORAS_TARDE).map((hora) => (
                            <SelectItem key={hora} value={hora}>
                              {hora}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hora-fin" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Hora fin
                      </Label>
                      <Select value={selectedHoraFin} onValueChange={setSelectedHoraFin}>
                        <SelectTrigger id="hora-fin" className="bg-transparent border-gray-300 dark:border-gray-700">
                          <SelectValue placeholder="Seleccionar hora" />
                        </SelectTrigger>
                        <SelectContent>
                          {(grupoTurno === "MAÑANA" ? HORAS_MAÑANA : HORAS_TARDE).map((hora) => (
                            <SelectItem key={hora} value={hora}>
                              {hora}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={handleAddHorario}
                        variant="default"
                        className="w-full bg-orange-web hover:bg-orange-web/90 text-white"
                        disabled={horarios.length >= schedulesToAdd || isValidatingHorario}
                      >
                        {isValidatingHorario ? (
                          <div className="flex items-center">
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                            Validando...
                          </div>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar Horario
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {horarios.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Horarios agregados ({horarios.length}/{schedulesToAdd})
                        </Label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {horarios.length < schedulesToAdd
                            ? `Faltan ${schedulesToAdd - horarios.length} horarios`
                            : "Completo"}
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {horarios.map((horario, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-white/30"
                          >
                            <span className="text-gray-800 dark:text-gray-200">
                              {horario.dia} {horario.hora_inicio} - {horario.hora_fin}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveHorario(index)}
                              className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={addGrupo}
                      className="bg-orange-web hover:bg-orange-web/90 text-white"
                      disabled={horarios.length !== schedulesToAdd}
                    >
                      Agregar Grupo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-oxford-blue border border-gray-200 dark:border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-oxford-blue dark:text-white">Grupos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="filter-materia" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Filtrar por materia
                  </Label>
                  <Input
                    id="filter-materia"
                    className="bg-transparent border-gray-300 dark:border-gray-700"
                    value={filterByMateria}
                    onChange={(e) => setFilterByMateria(e.target.value)}
                    placeholder="Buscar por nombre de materia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-grupo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Filtrar por grupo
                  </Label>
                  <Input
                    id="filter-grupo"
                    className="bg-transparent border-gray-300 dark:border-gray-700"
                    value={filterByGrupo}
                    onChange={(e) => setFilterByGrupo(e.target.value)}
                    placeholder="Buscar por número de grupo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-turno" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Filtrar por turno
                  </Label>
                  <Select value={filterByTurno} onValueChange={setFilterByTurno}>
                    <SelectTrigger id="filter-turno" className="bg-transparent border-gray-300 dark:border-gray-700">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="MAÑANA">Mañana</SelectItem>
                      <SelectItem value="TARDE">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4">
                {Object.entries(groupedGrupos).map(([numero, grupos]) => (
                  <div
                    key={numero}
                    className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/20 bg-transparent"
                  >
                    <div className="bg-orange-web/10 dark:bg-orange-web/20 p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="bg-orange-web text-white rounded-md p-2 flex items-center justify-center">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{numero}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {grupos.length} {grupos.length === 1 ? "materia" : "materias"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {grupos.map((grupo) => {
                      const materia = materias.find((m) => m.id === grupo.materia_id)
                      return (
                        <div
                          key={grupo.id}
                          className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                {materia?.nombre}
                              </h4>
                              <div className="flex items-center mt-2 space-x-3">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                  <Users className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                                  {grupo.alumnos} alumnos
                                </div>
                                <div className="px-2 py-1 text-xs rounded-full bg-orange-web/10 text-orange-web font-medium">
                                  {grupo.turno}
                                </div>
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="space-y-1">
                                {grupo.horarios &&
                                  sortHorarios(grupo.horarios).map((horario, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center text-sm text-gray-700 dark:text-gray-300"
                                    >
                                      <Clock className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                                      <span>
                                        {horario.dia} {horario.hora_inicio} - {horario.hora_fin}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditGrupo(grupo)}
                                className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmDeleteGrupo(grupo.id)}
                                className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}

                {Object.keys(groupedGrupos).length === 0 && (
                  <div className="text-center py-10 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-center mb-3">
                      <BookOpen className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No hay grupos</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      No se encontraron grupos con los filtros actuales.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Dialog open={isEditMateriaModalOpen} onOpenChange={setIsEditMateriaModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Materia</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nombre de la materia"
                  value={nombreMateria}
                  onChange={(e) => setNombreMateria(e.target.value)}
                />
                <Select value={profesorId || ""} onValueChange={setProfesorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar profesor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente por asignar</SelectItem>
                    {profesores.map((profesor) => (
                      <SelectItem key={profesor.id} value={profesor.id.toString()}>
                        {profesor.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditMateriaModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={updateMateria}>Guardar cambios</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

       
          <Dialog open={isDeleteGrupoModalOpen} onOpenChange={setIsDeleteGrupoModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar eliminación</DialogTitle>
              </DialogHeader>
              <div className="py-3">
                <p>¿Está seguro de que desea eliminar este grupo? Esta acción no se puede deshacer.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Se eliminarán también todas las asignaciones asociadas a este grupo.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteGrupoModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={executeDeleteGrupo}>
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDeleteMateriaModalOpen} onOpenChange={setIsDeleteMateriaModalOpen}>
    <DialogContent>
        <DialogHeader>
            {/* HE AQUÍ LA CORRECCIÓN: Añade este DialogTitle */}
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
                ¿Está seguro de que desea eliminar esta materia? Esta acción no se puede deshacer.
                Se eliminarán también todos los grupos y asignaciones asociadas a esta materia.
            </DialogDescription>
        </DialogHeader>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteMateriaModalOpen(false)}>
                Cancelar
            </Button>
            <Button variant="destructive" onClick={executeDeleteMateria}>
                Eliminar
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

          <Dialog open={isConflictoModalOpen} onOpenChange={setIsConflictoModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-500">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Conflicto de Horarios
                </DialogTitle>
              </DialogHeader>
              <div className="py-3">
                <p className="font-medium">{conflictoHorario?.mensaje}</p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Conflictos detectados:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {conflictoHorario?.detalles.map((detalle, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {detalle}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {conflictoHorario?.tipo === "materia"
                    ? "Una materia no puede impartirse en dos lugares al mismo tiempo."
                    : conflictoHorario?.tipo === "profesor"
                      ? "Un profesor no puede impartir dos materias al mismo tiempo."
                      : conflictoHorario?.tipo === "duplicado"
                        ? "No se pueden tener horarios duplicados para el mismo grupo."
                        : "Los horarios no pueden superponerse para el mismo grupo."}
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsConflictoModalOpen(false)}>Entendido</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditGrupoModalOpen} onOpenChange={setIsEditGrupoModalOpen}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-[#0f172a] text-white border-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-800 relative">
                  <button
                    onClick={() => setIsEditGrupoModalOpen(false)}
                    className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <h2 className="text-2xl font-bold mb-1">Editar Grupo</h2>

                  {editingGrupo && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-400" />
                        <span className="font-medium text-blue-300">{getEditingMateriaName()}</span>
                      </div>
                      <div className="hidden sm:block text-gray-500">•</div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-emerald-400" />
                        <span className="text-emerald-300">{getEditingProfesorName()}</span>
                      </div>
                      <div className="ml-auto">
                        <Badge className="bg-orange-500/90 hover:bg-orange-500 text-white border-0 px-3 py-1">
                          {editingGrupo.turno}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex border-b border-gray-800">
                  <button
                    className={`flex-1 py-4 px-6 flex justify-center items-center gap-2 transition-colors ${
                      activeTab === "info"
                        ? "bg-blue-900/30 border-b-2 border-blue-500 text-blue-300"
                        : "hover:bg-gray-800/50 text-gray-400"
                    }`}
                    onClick={() => setActiveTab("info")}
                  >
                    <School className="h-5 w-5" />
                    <span className="font-medium">Información del Grupo</span>
                  </button>
                  <button
                    className={`flex-1 py-4 px-6 flex justify-center items-center gap-2 transition-colors ${
                      activeTab === "horarios"
                        ? "bg-blue-900/30 border-b-2 border-blue-500 text-blue-300"
                        : "hover:bg-gray-800/50 text-gray-400"
                    }`}
                    onClick={() => setActiveTab("horarios")}
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">Horarios</span>
                  </button>
                </div>

                <div className="p-6 flex-1 bg-[#131c31]">
                  {activeTab === "info" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-gray-300">Número de grupo</Label>
                          <Input
                            placeholder="Número de grupo"
                            value={grupoNumero}
                            onChange={(e) => setGrupoNumero(e.target.value)}
                            className="bg-[#1a2642] border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">Número de alumnos</Label>
                          <Input
                            type="number"
                            placeholder="Número de alumnos"
                            value={grupoAlumnos}
                            onChange={(e) => setGrupoAlumnos(e.target.value)}
                            className="bg-[#1a2642] border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">Turno</Label>
                          <Select
                            value={grupoTurno}
                            onValueChange={(value: "MAÑANA" | "TARDE") => setGrupoTurno(value)}
                          >
                            <SelectTrigger className="bg-[#1a2642] border-gray-700 text-white focus:ring-blue-500">
                              <SelectValue placeholder="Seleccionar turno" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a2642] border-gray-700 text-white">
                              <SelectItem value="MAÑANA">Mañana</SelectItem>
                              <SelectItem value="TARDE">Tarde</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300">Horas de clase</Label>
                        <div className="flex gap-3 items-center">
                          <Input
                            type="number"
                            value={horasClase}
                            onChange={(e) => handleHorasClaseChange(e.target.value)}
                            min="1"
                            max="10"
                            placeholder="Ej: 3"
                            className="bg-[#1a2642] border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 w-32"
                          />
                          <div className="text-sm text-gray-400">
                            {horarios.length}/{schedulesToAdd} horarios configurados
                          </div>
                        </div>
                        {horarios.length !== Number.parseInt(horasClase || "0") &&
                          Number.parseInt(horasClase || "0") > 0 && (
                            <p className="text-amber-400 text-sm flex items-center gap-1 mt-1">
                              <AlertTriangle className="h-4 w-4" />
                              {horarios.length < Number.parseInt(horasClase || "0")
                                ? `Faltan ${Number.parseInt(horasClase || "0") - horarios.length} horarios por configurar`
                                : `Hay ${horarios.length - Number.parseInt(horasClase || "0")} horarios de más`}
                            </p>
                          )}
                      </div>

                      <div className="pt-4">
                        <Button
                          onClick={() => setActiveTab("horarios")}
                          className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                        >
                          Continuar a configuración de horarios
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeTab === "horarios" && (
                    <div className="space-y-6">
                      <div className="bg-[#1a2642] rounded-lg p-4 border border-gray-700">
                        <h3 className="text-lg font-medium text-white mb-4">Agregar nuevo horario</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-300">Día</Label>
                            <Select value={selectedDia} onValueChange={setSelectedDia}>
                              <SelectTrigger className="bg-[#131c31] border-gray-700 text-white focus:ring-blue-500">
                                <SelectValue placeholder="Seleccionar día" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1a2642] border-gray-700 text-white">
                                {DIAS.map((dia) => (
                                  <SelectItem key={dia} value={dia}>
                                    {dia}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-300">Hora inicio</Label>
                            <Select value={selectedHoraInicio} onValueChange={setSelectedHoraInicio}>
                              <SelectTrigger className="bg-[#131c31] border-gray-700 text-white focus:ring-blue-500">
                                <SelectValue placeholder="Seleccionar hora" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1a2642] border-gray-700 text-white">
                                {(grupoTurno === "MAÑANA" ? HORAS_MAÑANA : HORAS_TARDE).map((hora) => (
                                  <SelectItem key={hora} value={hora}>
                                    {hora}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-300">Hora fin</Label>
                            <Select value={selectedHoraFin} onValueChange={setSelectedHoraFin}>
                              <SelectTrigger className="bg-[#131c31] border-gray-700 text-white focus:ring-blue-500">
                                <SelectValue placeholder="Seleccionar hora" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1a2642] border-gray-700 text-white">
                                {(grupoTurno === "MAÑANA" ? HORAS_MAÑANA : HORAS_TARDE).map((hora) => (
                                  <SelectItem key={hora} value={hora} disabled={hora <= selectedHoraInicio}>
                                    {hora}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-end">
                            <Button
                              onClick={handleAddHorario}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
                              disabled={
                                isValidatingHorario ||
                                !selectedDia ||
                                !selectedHoraInicio ||
                                !selectedHoraFin ||
                                horarios.length >= schedulesToAdd
                              }
                            >
                              {isValidatingHorario ? (
                                <div className="flex items-center">
                                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                  Validando...
                                </div>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Agregar Horario
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-medium text-white">Horarios configurados</h3>
                          <div className="text-sm text-gray-400">
                            {horarios.length}/{schedulesToAdd} horarios
                          </div>
                        </div>

                        {horarios.length > 0 ? (
                          <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {sortHorarios(horarios).map((horario, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-[#1a2642] rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                              >
                                <div className="flex items-center">
                                  <div className="bg-blue-900/50 text-blue-400 rounded-full p-2 mr-3">
                                    <Clock className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-white">{horario.dia}</div>
                                    <div className="text-gray-400">
                                      {horario.hora_inicio} - {horario.hora_fin}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveHorario(index)}
                                  className="h-9 w-9 p-0 rounded-full bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[200px] text-center p-4 text-gray-500 bg-[#1a2642]/50 rounded-lg border border-dashed border-gray-700">
                            <Calendar className="h-12 w-12 mb-3 text-gray-600" />
                            <p className="text-gray-400 font-medium">No hay horarios configurados</p>
                            <p className="text-sm text-gray-500 mt-1">Agrega al menos un horario para este grupo</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-800 flex justify-between gap-2 bg-[#0f172a]">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditGrupoModalOpen(false)
                      setEditingGrupo(null)
                      setGrupoNumero("")
                      setGrupoAlumnos("")
                      setGrupoTurno("MAÑANA")
                      setHorarios([])
                      setSchedulesToAdd(0)
                      setHorasClase("")
                    }}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    Cancelar
                  </Button>

                  <div className="flex gap-2">
                    {activeTab === "horarios" && (
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("info")}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Volver
                      </Button>
                    )}

                    <Button
                      onClick={updateGrupo}
                      disabled={
                        !grupoNumero ||
                        !grupoAlumnos ||
                        horarios.length === 0 ||
                        horarios.length !== Number.parseInt(horasClase || "0")
                      }
                      className="bg-orange-500 hover:bg-orange-600 text-white border-0"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Guardar cambios
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDuplicadoModalOpen} onOpenChange={setIsDuplicadoModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-500">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Materia Duplicada
                </DialogTitle>
              </DialogHeader>
              <div className="py-3">
                <p className="font-medium">{mensajeDuplicado}</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  No se pueden tener materias duplicadas con el mismo profesor. Por favor, utilice un nombre diferente o
                  asigne otro profesor.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsDuplicadoModalOpen(false)}>Entendido</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
;<style jsx global>{`
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #131c31;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2d3a58;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3b4a6b;
}
`}</style>

