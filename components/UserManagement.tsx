"use client"
import CarreraSelect from "@/components/carrera-select"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Pencil, Trash2, UserPlus, Eye, EyeOff, AlertTriangle, ShieldAlert } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

interface Usuario {
  id: string
  nombre: string
  rol: string
  email?: string
  carrera_id?: number | null
  carrera_nombre?: string | null
}
type Carrera = { id: number; nombre: string }

export default function UserManagement() {
  const { user: currentUser, isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [email, setEmail] = useState("")
  const [nombre, setNombre] = useState("")
  const [rol, setRol] = useState<string>("usuario")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSelfDeleteModalOpen, setIsSelfDeleteModalOpen] = useState(false);
  const [carreraId, setCarreraId] = useState<number | null>(null)
  const [editCarreraId, setEditCarreraId] = useState<number | null>(null)
  const [carreras, setCarreras] = useState<Carrera[]>([])
const [carrerasLoading, setCarrerasLoading] = useState(true)
  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('No se pudieron cargar los usuarios.');
      const data = await response.json();
      setUsuarios(data.users || data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setCarrerasLoading(true)
        const r = await fetch("/api/carreras")
        if (!r.ok) throw new Error("No se pudieron cargar las carreras")
        const data = await r.json()
        if (alive) setCarreras(data)
      } catch {
        if (alive) setCarreras([])
      } finally {
        if (alive) setCarrerasLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])
  async function addUser() {
    if (!email || !nombre || !rol || !password) {
      toast({ title: "Error", description: "Por favor complete todos los campos.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre, rol, password, carrera_id: carreraId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      toast({ title: "Éxito", description: "Usuario creado correctamente." });
      fetchData();
      setEmail("");
      setNombre("");
      setRol("usuario");
      setPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateUser() {
    if (!editingUser) return;
    setIsLoading(true);
    try {
        const response = await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingUser.id, nombre, rol, carrera_id: editCarreraId }),



        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        toast({ title: "Éxito", description: "Usuario actualizado." });
        await fetchData();
setIsEditModalOpen(false);
        setIsEditModalOpen(false);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
        setIsSelfDeleteModalOpen(true);
        return;
    }
    setUserToDelete(userId);
    setIsDeleteModalOpen(true);
  };
  
  async function deleteUser() {
    if (!userToDelete) return;
    setIsLoading(true);
    try {
        const response = await fetch(`/api/users?id=${userToDelete}`, {
            method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        toast({ title: "Éxito", description: "Usuario eliminado." });
        fetchData();
        setIsDeleteModalOpen(false);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }

  const handleEditUser = (user: Usuario) => {
    setEditingUser(user);
    setNombre(user.nombre);
    setRol(user.rol);
    setEditCarreraId(user.carrera_id ?? null);
    setIsEditModalOpen(true);
  
   

  };
  
  const columns: ColumnDef<Usuario>[] = [
    { accessorKey: "nombre", header: "Nombre" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "rol", header: "Rol", cell: ({ row }) => <span className="capitalize">{row.original.rol}</span> },
    { accessorKey: "carrera_nombre", header: "Carrera", cell: ({ row }) => row.original.carrera_nombre || "N/A" },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEditUser(row.original)}><Pencil className="h-4 w-4 mr-1" />Editar</Button>
          {currentUser?.id !== row.original.id && (
            <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(row.original.id)}><Trash2 className="h-4 w-4 mr-1" />Eliminar</Button>
          )}
        </div>
      ),
    },
  ];

  if (!isAdmin) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acceso Denegado</AlertTitle>
            <AlertDescription>No tienes permisos para acceder a esta sección.</AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Gestión de Usuarios</h2>
      {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      
      <Card>
        <CardHeader><CardTitle>Agregar Nuevo Usuario</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <Select value={rol} onValueChange={setRol}>
              
              
              <SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="director">Director</SelectItem>
                 <SelectItem value="usuario">Usuario</SelectItem>
              </SelectContent>

            </Select>
            <div className="md:col-span-2">
              <CarreraSelect value={carreraId} onChange={setCarreraId} />

</div>

            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={addUser} disabled={isLoading}><UserPlus className="h-4 w-4 mr-2" />{isLoading ? "Agregando..." : "Agregar Usuario"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lista de UsuariosS</CardTitle></CardHeader>
        <CardContent>
            <DataTable columns={columns} data={usuarios} />
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>Editar Usuario</DialogTitle></DialogHeader>
    <div className="space-y-4">
      <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <Select value={rol} onValueChange={setRol}>
  <SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="admin">Administrador</SelectItem>
    <SelectItem value="director">Director</SelectItem>
    <SelectItem value="usuario">Usuario</SelectItem>
  </SelectContent>
</Select>

<div className="md:col-span-2">
<CarreraSelect
  value={editCarreraId}
  onChange={setEditCarreraId}
/>
</div>

    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
      <Button onClick={updateUser} disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle></DialogHeader>
            <DialogDescription>¿Estás seguro de que quieres eliminar este usuario? Esta acción es irreversible.</DialogDescription>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={deleteUser} disabled={isLoading}>{isLoading ? "Eliminando..." : "Eliminar"}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isSelfDeleteModalOpen} onOpenChange={setIsSelfDeleteModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><ShieldAlert />Acción no permitida</DialogTitle></DialogHeader>
            <DialogDescription>Por seguridad, no puedes eliminar tu propia cuenta de administrador.</DialogDescription>
            <DialogFooter>
                <Button onClick={() => setIsSelfDeleteModalOpen(false)}>Entendido</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
