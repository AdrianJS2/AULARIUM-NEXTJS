"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DataTable } from "@/components/ui/data-table"
import { featureFlags } from '@/lib/config' //featuare flag
import { toast } from "@/components/ui/use-toast"
import { Upload, Search, AlertTriangle, UserPlus, Info, Link2Off, Clock, Eye, Edit, Plus, Mail,Trash2} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CSVUpload } from "./CSVUpload"
import DisponibilidadProfesor from "./DisponibilidadProfesor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface Profesor {
  id: string
  nombre: string
  email: string
  usuario_id?: string
  is_associated?: boolean
  disponibilidad?: any
}

const EditModal = ({ isOpen, onClose, profesor, onSave, fetchProfesores }) => {
  const [nombreEdit, setNombreEdit] = useState(profesor?.nombre || "")
  const [emailEdit, setEmailEdit] = useState(profesor?.email || "")
  const [activeTab, setActiveTab] = useState("info")
  const [disponibilidadKey, setDisponibilidadKey] = useState(0) // Añadir esta línea

  useEffect(() => {
    if (profesor) {
      setNombreEdit(profesor.nombre)
      setEmailEdit(profesor.email)
      setActiveTab("info") // Reset to info tab when opening
      setDisponibilidadKey((prev) => prev + 1) // Añadir esta línea para forzar re-render
    }
  }, [profesor])

  const handleSave = () => {
    onSave({ ...profesor, nombre: nombreEdit, email: emailEdit })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar Profesor</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="disponibilidad">Disponibilidad</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="nombre" className="text-sm font-medium">
                  Nombre del profesor
                </label>
                <Input
                  id="nombre"
                  placeholder="Nombre del profesor"
                  value={nombreEdit}
                  onChange={(e) => setNombreEdit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email del profesor
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email del profesor"
                  value={emailEdit}
                  onChange={(e) => setEmailEdit(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Guardar cambios</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="disponibilidad" className="mt-4">
            {profesor && activeTab === "disponibilidad" && (
              <DisponibilidadProfesor
                key={disponibilidadKey} // Añadir esta línea para forzar re-render
                profesorId={profesor.id}
                onSave={() => {
                  toast({
                    title: "Disponibilidad actualizada",
                    description: "La disponibilidad del profesor ha sido actualizada correctamente",
                  })
                  // Refrescar la lista de profesores para mostrar los cambios
                  fetchProfesores()
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default function ProfesorManagement() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [editingProfesor, setEditingProfesor] = useState<Profesor | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [profesorToDelete, setProfesorToDelete] = useState<Profesor | null>(null)
  const [showCSVUpload, setShowCSVUpload] = useState(false)
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const useMySqlApi = featureFlags.profesores === 'mysql';
  const [existingProfesors, setExistingProfesors] = useState<Profesor[]>([])
  const [showAssociateDialog, setShowAssociateDialog] = useState(false)
  const [selectedProfesorId, setSelectedProfesorId] = useState<string | null>(null)
  const [isTableCreated, setIsTableCreated] = useState(false)

  const [userRole, setUserRole] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [showDisassociateDialog, setShowDisassociateDialog] = useState(false)
  const [profesorToDisassociate, setProfesorToDisassociate] = useState<Profesor | null>(null)
  const [showDisponibilidadDialog, setShowDisponibilidadDialog] = useState(false)
  const [selectedProfesorForDisponibilidad, setSelectedProfesorForDisponibilidad] = useState<Profesor | null>(null)
  const [viewMode, setViewMode] = useState(true) // Nuevo estado para controlar el modo de visualización
  const { user, isAdmin, loading: authLoading } = useAuth() // Usar useAuth para obtener el estado de autenticación

  // Función para verificar si el usuario es administrador usando localStorage
  const checkAdminFromLocalStorage = useCallback(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("userRole")
      if (storedRole === "admin") {
        console.log("Usando rol admin desde localStorage")
        setIsUserAdmin(true)
        setUserRole("admin")
        return true
      }
    }
    return false
  }, [])


  // Función para cargar profesores
  const fetchProfesores = useCallback(async () => {
    // No hacer nada hasta que la sesión del usuario esté confirmada.
    if (authLoading) return;

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/profesores')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar profesores desde la API')
      }
      const data = await response.json()
      setProfesores(data || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar los profesores"
      console.error("Error fetching profesores:", error)
      setError(message)
      toast({
        title: "Error de Carga",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [authLoading])

  // Efecto para inicializar datos al montar el componente
  useEffect(() => {
    fetchProfesores()
  }, [fetchProfesores])


  // Efecto para recargar profesores cuando cambia el rol o usuario
  useEffect(() => {
    if (userRole !== null) {
      console.log("Ejecutando fetchProfesores debido a cambio en userRole:", userRole)
      fetchProfesores()
    }
  }, [userRole, fetchProfesores])

  async function addProfesor() {
    // --- 1. Tu lógica de validación se mantiene intacta ---
    if (!nombre || !email) {
      setValidationMessage("Por favor, complete todos los campos OBLIGATORIOS.")
      setShowValidationDialog(true)
      return
    }
  
    if (!isValidEmail(email)) {
      setValidationMessage("Por favor, ingrese un email válido.")
      setShowValidationDialog(true)
      return
    }
  
    // --- 2. Tu lógica para buscar duplicados y asociar se mantiene ---
    // (Esta parte seguirá usando Supabase por ahora, ya que es una funcionalidad compleja)
    if (!useMySqlApi) {
        const { data: existingProfesors, error: searchError } = await supabase
        .from("profesores")
        .select("*")
        .or(`nombre.ilike.%${nombre}%,email.ilike.${email}`)
  
        if (searchError) {
          console.error("Error buscando profesores existentes:", searchError)
          setValidationMessage("Error al buscar profesores existentes. Por favor, intente de nuevo.")
          setShowValidationDialog(true)
          return
        }
  
        if (existingProfesors && existingProfesors.length > 0) {
          setExistingProfesors(existingProfesors)
          setShowAssociateDialog(true)
          return
        }
    }
  
  
    // --- 3. La inserción del nuevo profesor ahora usa el Feature Flag ---
    setIsLoading(true);
    try {
      const profesorData = {
        nombre,
        email,
        usuario_id: user?.id,
      };
  
      if (useMySqlApi) {
        // Si el flag es 'mysql', llama a nuestra nueva API
        const response = await fetch('/api/profesores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profesorData),
        });
        const responseData = await response.json();
        if (!response.ok) {
          // Lanza un error para que el bloque catch lo maneje
          throw new Error(responseData.error || 'Error al agregar el profesor');
        }
      } 
  
      // --- 4. El código de éxito se ejecuta si no hubo errores ---
      fetchProfesores()
      setNombre("")
      setEmail("")
      toast({
        title: "Éxito",
        description: "Profesor agregado correctamente",
      })
  
    } catch (err) {
      // --- 5. Manejo de errores unificado ---
      const message = err instanceof Error ? err.message : "Ocurrió un error al agregar el profesor.";
      console.error("Error adding profesor:", err);
      setValidationMessage(message);
      setShowValidationDialog(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateProfesor() {
    if (!editingProfesor || !nombre || !email) {
      return
    }

    const { data, error } = await supabase.from("profesores").update({ nombre, email }).eq("id", editingProfesor.id)
    if (error) {
      console.error("Error updating profesor:", error)
      if (error.code === "23505") {
        setError("El nombre o correo del profesor ya está en uso por otro registro.")
      } else {
        setError("Error al actualizar el profesor. Por favor, intenta de nuevo.")
      }
    } else {
      fetchProfesores()
      setEditingProfesor(null)
      setNombre("")
      setEmail("")
      setIsEditModalOpen(false)
    }
  }

  async function deleteProfesor(profesor: Profesor) {
    // Verificar si el usuario tiene permiso para eliminar este profesor
    if (!isAdmin && profesor.usuario_id !== user?.id) {
      setError("No tienes permiso para eliminar este profesor.")
      return
    }
    setProfesorToDelete(profesor)
    setShowDeleteConfirmDialog(true)
  }

 // En components/ProfesorManagement.tsx

 const handleDeleteConfirm = async () => {
  if (!profesorToDelete) return;
  
  setIsLoading(true);
  try {
    if (useMySqlApi) {
      // Lógica para MySQL: Llama a la API que ya se encarga de todo
      const response = await fetch(`/api/profesores?id=${profesorToDelete.id}`, {
        method: 'DELETE',
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || 'Error al eliminar');
    } else {
      // Lógica para Supabase: Mantiene el código original para desvincular
      const tablasMaterias = ["materias_enero_abril", "materias_mayo_agosto", "materias_septiembre_diciembre"];
      for (const tabla of tablasMaterias) {
        const { error: updateError } = await supabase
          .from(tabla)
          .update({ profesor_id: null })
          .eq("profesor_id", profesorToDelete.id);
        if (updateError) {
          // Este es el error que estabas viendo, ahora solo se ejecuta en modo Supabase
          throw new Error(`Fallo al actualizar '${tabla}': ${JSON.stringify(updateError)}`);
        }
      }
      const { error: deleteError } = await supabase.from("profesores").delete().eq("id", profesorToDelete.id);
      if (deleteError) throw deleteError;
    }
    
    fetchProfesores();
    toast({ title: "Éxito", description: "Profesor eliminado correctamente." });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Hubo un problema al eliminar.";
    setError(message);
    toast({ variant: "destructive", title: "Error de Eliminación", description: message });
  } finally {
    setShowDeleteConfirmDialog(false);
    setProfesorToDelete(null);
    setIsLoading(false);
  }
};

  async function disassociateProfesor(profesor: Profesor) {
    if (!profesor || !currentUserId) return

    setProfesorToDisassociate(profesor)
    setShowDisassociateDialog(true)
  }

  async function handleDisassociateConfirm() {
    if (!profesorToDisassociate || !currentUserId) return

    try {
      // Convertir el ID a número si es necesario
      const profesorIdNumber = Number.parseInt(profesorToDisassociate.id, 10)

      if (isNaN(profesorIdNumber)) {
        throw new Error("ID de profesor inválido")
      }

      // Eliminar la asociación de la tabla profesor_usuario
      const { error } = await supabase
        .from("profesor_usuario")
        .delete()
        .eq("profesor_id", profesorIdNumber)
        .eq("usuario_id", currentUserId)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Profesor desasociado correctamente",
      })

      // Actualizar la lista de profesores
      fetchProfesores()
    } catch (error) {
      console.error("Error al desasociar profesor:", error)
      setError("Error al desasociar el profesor: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setShowDisassociateDialog(false)
      setProfesorToDisassociate(null)
    }
  }

  async function associateProfesor(profesorId: string) {
    try {
      if (!currentUserId) {
        setValidationMessage("No se pudo identificar tu usuario. Por favor, inicia sesión nuevamente.")
        setShowValidationDialog(true)
        return
      }

      // Verificar si la tabla profesor_usuario existe
      const tableExists = await checkTableExists()

      if (!tableExists) {
        setValidationMessage(
          "La funcionalidad de asociación de profesores no está disponible en este momento. Por favor, contacta al administrador.",
        )
        setShowValidationDialog(true)
        setShowAssociateDialog(false)
        return
      }

      // Verificar si ya existe una asociación
      const { data: existingAssociation, error: checkError } = await supabase
        .from("profesor_usuario")
        .select("*")
        .eq("profesor_id", profesorId)
        .eq("usuario_id", currentUserId)
        .single()

      if (!checkError && existingAssociation) {
        setValidationMessage("Este profesor ya está asociado a tu cuenta.")
        setShowValidationDialog(true)
        setShowAssociateDialog(false)
        return
      }

      // Crear la asociación en la tabla profesor_usuario
      // Nota: profesorId es un string pero necesitamos convertirlo a número para la BD
      const profesorIdNumber = Number.parseInt(profesorId, 10)

      if (isNaN(profesorIdNumber)) {
        throw new Error("ID de profesor inválido")
      }

      const { error: associateError } = await supabase.from("profesor_usuario").insert([
        {
          profesor_id: profesorIdNumber, // Usar el ID como número
          usuario_id: currentUserId,
        },
      ])

      if (associateError) {
        throw associateError
      }

      fetchProfesores()
      setShowAssociateDialog(false)
      setNombre("")
      setEmail("")
      toast({
        title: "Éxito",
        description: "Profesor asociado correctamente a tu cuenta",
      })
    } catch (error) {
      console.error("Error al asociar profesor:", error)
      setValidationMessage("Error al asociar el profesor: " + (error instanceof Error ? error.message : String(error)))
      setShowValidationDialog(true)
    }
  }

  const handleEditProfesor = (profesor: Profesor) => {
    // ✅ Usar `isAdmin` del hook
    if (!isAdmin && profesor.usuario_id !== user?.id) {
      setError("No tienes permiso para editar este profesor.")
      return
    }
    setEditingProfesor(profesor)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingProfesor(null)
    setNombre("")
    setEmail("")
  }

  const handleSaveEdit = async (updatedProfesor: Profesor) => {
    if (!updatedProfesor.nombre || !updatedProfesor.email) {
     setValidationMessage("Por favor, complete todos los campos obligatorios.")
     setShowValidationDialog(true)
     return
   }

   if (!isValidEmail(updatedProfesor.email)) {
     setValidationMessage("Por favor, ingrese un email válido.")
     setShowValidationDialog(true)
     return
   }

    try {
      const response = await fetch('/api/profesores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfesor),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "No se pudo actualizar el profesor.");
      }

      fetchProfesores();
      handleCloseEditModal();
      toast({ title: "Éxito", description: "Profesor actualizado correctamente." });
    } catch (error: any) {
      console.error("Error updating profesor:", error);
      setValidationMessage(error.message);
      setShowValidationDialog(true);
    }
 }
  const handleShowDisponibilidad = (profesor: Profesor) => {
    setSelectedProfesorForDisponibilidad(profesor)
    setViewMode(true) // Establecer en modo de solo lectura
    setShowDisponibilidadDialog(true)
  }

  const handleEditDisponibilidad = (profesor: Profesor) => {
    setSelectedProfesorForDisponibilidad(profesor)
    setViewMode(false) // Establecer en modo de edición
    setShowDisponibilidadDialog(true)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Verificar que sea un archivo CSV
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        title: "Error",
        description: "Por favor, seleccione un archivo CSV válido",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const rows = text.split("\n")

        // Eliminar filas vacías
        const validRows = rows.filter((row) => row.trim() !== "")

        // Verificar formato: nombre,email
        const profesoresData = validRows.map((row) => {
          const [nombre, email] = row.split(",").map((item) => item.trim())
          if (!nombre || !email) {
            throw new Error("Formato de CSV inválido. Debe ser: nombre,email")
          }
          return { nombre, email }
        })

        // Insertar profesores en la base de datos
        for (const profesor of profesoresData) {
          const { error } = await supabase.from("profesores").insert([profesor])
          if (error) throw error
        }

        toast({
          title: "Éxito",
          description: `Se han importado ${profesoresData.length} profesores correctamente.`,
        })

        // Recargar la lista de profesores
        fetchProfesores()
      }
      reader.readAsText(file)
    } catch (error) {
      console.error("Error processing CSV:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el archivo CSV",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      // Limpiar el input file
      event.target.value = ""
    }
  }

  // Verificar si un profesor tiene disponibilidad configurada
  const tieneDisponibilidad = (profesor: Profesor) => {
    return profesor.disponibilidad && Object.keys(profesor.disponibilidad).length > 0
  }

  // Contar horas disponibles de un profesor
  const contarHorasDisponibles = (profesor: Profesor) => {
    if (!profesor.disponibilidad) return 0

    let total = 0
    Object.keys(profesor.disponibilidad).forEach((dia) => {
      if (profesor.disponibilidad[dia]) {
        Object.values(profesor.disponibilidad[dia]).forEach((disponible) => {
          if (disponible === true) total++
        })
      }
    })

    return total
  }

  // Filtrar profesores según el término de búsqueda
  const filteredProfesores = profesores.filter(
    (profesor) =>
      profesor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profesor.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns: ColumnDef<Profesor>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="flex items-center">
          <span className="text-base font-medium">{row.original.nombre}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{row.original.email}</span>
        </div>
      ),
    },
    {
      id: "disponibilidad",
      header: "Disponibilidad",
      cell: ({ row }) => {
        const profesor = row.original
        const horasDisponibles = contarHorasDisponibles(profesor)
        const tieneConfig = tieneDisponibilidad(profesor)

        return (
          <div className="flex items-center gap-2">
            <Badge
              variant={tieneConfig ? "outline" : "secondary"}
              className={`px-2 py-0.5 ${tieneConfig ? "border-green-500 text-green-600" : "text-amber-600"}`}
            >
              <Clock className="h-3 w-3 mr-1" />
              {horasDisponibles} horas
            </Badge>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShowDisponibilidad(profesor)}
                className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Ver
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditDisponibilidad(profesor)}
                className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Editar
              </Button>
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const profesor = row.original
        const canEdit = isUserAdmin || profesor.usuario_id === currentUserId
        const isAssociated = profesor.is_associated === true

        return (
          <div className="flex justify-end space-x-2">
            {isAssociated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => disassociateProfesor(profesor)}
                className="text-amber-500 border-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20"
              >
                <Link2Off className="h-4 w-4 mr-1" />
                Desasociar
              </Button>
            ) : (
              canEdit && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleEditProfesor(profesor)}>
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteProfesor(profesor)}>
                    Eliminar
                  </Button>
                </>
              )
            )}
          </div>
        )
      },
    },
  ]

  const AssociateDialog = () => (
    <AlertDialog open={showAssociateDialog} onOpenChange={setShowAssociateDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Profesor existente encontrado</AlertDialogTitle>
          <AlertDialogDescription>
            Hemos encontrado uno o más profesores con información similar. Puedes asociar uno de estos profesores a tu
            cuenta para verlo y utilizarlo sin crear un duplicado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-60 overflow-y-auto my-4 space-y-2">
          {existingProfesors.map((profesor) => (
            <div
              key={profesor.id}
              className={`p-3 rounded-md border cursor-pointer transition-all ${
                selectedProfesorId === profesor.id
                  ? "bg-primary/10 border-primary shadow-sm"
                  : "border-border hover:bg-muted/50 hover:border-primary/30"
              }`}
              onClick={() => setSelectedProfesorId(profesor.id)}
            >
              <div className="font-medium">{profesor.nombre}</div>
              <div className="text-sm text-muted-foreground">{profesor.email}</div>
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowAssociateDialog(false)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => selectedProfesorId && associateProfesor(selectedProfesorId)}
            disabled={!selectedProfesorId}
            className={!selectedProfesorId ? "opacity-50 cursor-not-allowed" : ""}
          >
            Asociar Profesor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Profesores</h2>

      {/* Información de depuración para administradores */}
      {isUserAdmin && debugInfo && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <Info className="h-4 w-4" />
          <AlertTitle>Información de depuración (solo visible para administradores)</AlertTitle>
          <AlertDescription className="font-mono text-xs">{debugInfo}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isTableCreated && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <UserPlus className="h-4 w-4" />
          <AlertTitle>Funcionalidad limitada</AlertTitle>
          <AlertDescription>
            La funcionalidad de asociación de profesores no está disponible. Contacta al administrador para habilitar
            esta característica.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-auto sm:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar profesores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex justify-end">
          <Button variant="default" className="relative overflow-hidden" disabled={isLoading}>
            <Upload className="h-4 w-4 mr-2" />
            Cargar CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isLoading}
            />
          </Button>
        </div>
      </div>

      {/* Formulario para agregar profesores manualmente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Agregar Nuevo Profesor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="nombre" className="text-sm font-medium text-muted-foreground">
                Nombre del profesor
              </label>
              <Input
                id="nombre"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={addProfesor} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Procesando..." : "Agregar Profesor"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Lista de Profesores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredProfesores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No se encontraron profesores con ese término de búsqueda"
                : "No hay profesores disponibles"}
            </div>
          ) : (
            <DataTable columns={columns} data={filteredProfesores} />
          )}
        </CardContent>
      </Card>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        profesor={editingProfesor}
        onSave={handleSaveEdit}
        fetchProfesores={fetchProfesores}
      />

      <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error de Validación</AlertDialogTitle>
            <AlertDialogDescription>{validationMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowValidationDialog(false)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de que desea eliminar este profesor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las materias asignadas a este profesor cambiarán automáticamente a
              "Pendiente por asignar".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirmDialog(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Confirmar Eliminación</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showCSVUpload} onOpenChange={setShowCSVUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar Profesores desde CSV</DialogTitle>
          </DialogHeader>
          <CSVUpload
            onUploadComplete={() => {
              setShowCSVUpload(false)
              fetchProfesores()
            }}
          />
        </DialogContent>
      </Dialog>

      <AssociateDialog />

      <AlertDialog open={showDisassociateDialog} onOpenChange={setShowDisassociateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desasociar profesor</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas desasociar este profesor de tu cuenta? Esto no eliminará al profesor de la
              base de datos, solo lo quitará de tu lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDisassociateDialog(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisassociateConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showDisponibilidadDialog} onOpenChange={setShowDisponibilidadDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Disponibilidad del Profesor</DialogTitle>
          </DialogHeader>
          {selectedProfesorForDisponibilidad && (
            <DisponibilidadProfesor
              profesorId={selectedProfesorForDisponibilidad.id}
              readOnly={viewMode}
              onSave={() => {
                fetchProfesores()
                setShowDisponibilidadDialog(false)
              }}
              onCancel={() => setShowDisponibilidadDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
