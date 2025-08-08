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
   // Usar useAuth para obtener el estado de autenticación

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
  const { user, isAdmin, loading: authLoading } = useAuth()

  // 🔹 CAMBIO: Ahora `fetchProfesores` siempre usa tu API MySQL
  const fetchProfesores = useCallback(async () => {
    if (authLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/profesores')
      if (!response.ok) throw new Error('Error al cargar profesores')
      const data = await response.json()
      setProfesores(data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error desconocido")
      toast({ title: "Error de Carga", description: String(error), variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [authLoading])

  useEffect(() => { fetchProfesores() }, [fetchProfesores])


  // Efecto para recargar profesores cuando cambia el rol o usuario
  useEffect(() => {
    if (userRole !== null) {
      console.log("Ejecutando fetchProfesores debido a cambio en userRole:", userRole)
      fetchProfesores()
    }
  }, [userRole, fetchProfesores])

  // 🔹 CAMBIO: `addProfesor` ahora solo llama a tu API
  async function addProfesor() {
    if (!nombre || !email) {
      setValidationMessage("Complete todos los campos")
      setShowValidationDialog(true)
      return
    }
    if (!isValidEmail(email)) {
      setValidationMessage("Ingrese un email válido")
      setShowValidationDialog(true)
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch('/api/profesores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, usuario_id: user?.id }),
      })
      if (!response.ok) throw new Error('Error al agregar el profesor')
      fetchProfesores()
      setNombre("")
      setEmail("")
      toast({ title: "Éxito", description: "Profesor agregado correctamente" })
    } catch (error) {
      setValidationMessage(error instanceof Error ? error.message : "Error desconocido")
      setShowValidationDialog(true)
    } finally {
      setIsLoading(false)
    }
  }


  async function updateProfesor(profesor: Profesor) {
    try {
      const response = await fetch('/api/profesores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profesor),
      })
      if (!response.ok) throw new Error('Error al actualizar profesor')
      fetchProfesores()
      setIsEditModalOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error desconocido")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!profesorToDelete) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/profesores?id=${profesorToDelete.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Error al eliminar')
      fetchProfesores()
      toast({ title: "Éxito", description: "Profesor eliminado correctamente" })
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" })
    } finally {
      setShowDeleteConfirmDialog(false)
      setIsLoading(false)
    }
  }

 // En components/ProfesorManagement.tsx


  async function disassociateProfesor(profesor: Profesor) {
    if (!profesor || !currentUserId) return

    setProfesorToDisassociate(profesor)
    setShowDisassociateDialog(true)
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
