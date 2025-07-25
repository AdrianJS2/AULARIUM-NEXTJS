"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { featureFlags } from '@/lib/config'; // Importar feature flags

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, AlertTriangle, Info, Lightbulb } from "lucide-react"

interface Aula {
  id: number
  nombre: string
  capacidad: number
  equipamiento: string
}

const EditModal = ({ isOpen, onClose, aula, onSave }: { isOpen: boolean, onClose: () => void, aula: Aula | null, onSave: (aula: Aula) => void }) => {
    const [nombreEdit, setNombreEdit] = useState(aula?.nombre || "");
    const [capacidadEdit, setCapacidadEdit] = useState(aula?.capacidad.toString() || "");
    const [equipamientoEdit, setEquipamientoEdit] = useState(aula?.equipamiento || "");

    useEffect(() => {
        if (aula) {
            setNombreEdit(aula.nombre);
            setCapacidadEdit(aula.capacidad.toString());
            setEquipamientoEdit(aula.equipamiento);
        }
    }, [aula]);

    const handleSave = () => {
        onSave({
            ...aula!,
            nombre: nombreEdit,
            capacidad: Number.parseInt(capacidadEdit),
            equipamiento: equipamientoEdit,
        });
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Aula</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Input placeholder="Nombre del aula" value={nombreEdit} onChange={(e) => setNombreEdit(e.target.value)} />
                    <Input
                        type="number"
                        placeholder="Capacidad"
                        value={capacidadEdit}
                        onChange={(e) => setCapacidadEdit(e.target.value)}
                    />
                    <Input
                        placeholder="Equipamiento"
                        value={equipamientoEdit}
                        onChange={(e) => setEquipamientoEdit(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>Guardar cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function AulaManagement() {
    const [aulas, setAulas] = useState<Aula[]>([]);
    const [nombre, setNombre] = useState("");
    const [capacidad, setCapacidad] = useState("");
    const [equipamiento, setEquipamiento] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [editingAula, setEditingAula] = useState<Aula | null>(null);
    const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
    const [showNoEquipmentConfirmDialog, setShowNoEquipmentConfirmDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [showCapacidadAlertDialog, setShowCapacidadAlertDialog] = useState(false);
    const [filterAula, setFilterAula] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentAulaInfo, setCurrentAulaInfo] = useState<{ id: number; nombre: string } | null>(null);
    const [hasAssignments, setHasAssignments] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alertDialogOpen, setAlertDialogOpen] = useState(false);
    const [alertDialogTitle, setAlertDialogTitle] = useState("");
    const [alertDialogDescription, setAlertDialogDescription] = useState<React.ReactNode>("");
    const [alertDialogAction, setAlertDialogAction] = useState<"acknowledge" | "cancel">("acknowledge");
    const [showDuplicateNameDialog, setShowDuplicateNameDialog] = useState(false);
    const [duplicateAulaName, setDuplicateAulaName] = useState("");

    const useMySqlApi = featureFlags.aulas === 'mysql';

    const fetchAulas = async () => {
        setLoading(true);
        setError(null);
        try {
            let data: Aula[] | null = null;
            let error: any = null;

            if (useMySqlApi) {
                const response = await fetch('/api/aulas');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al cargar aulas desde la API de MySQL');
                }
                data = await response.json();
            } else {
                const response = await supabase.from("aulas").select("*");
                data = response.data;
                error = response.error;
            }
            
            if (error) throw error;
            
            const sortedAulas = (data || []).sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }));
            setAulas(sortedAulas);

        } catch (err) {
            console.error("Error fetching aulas:", err);
            setError(err instanceof Error ? err.message : "No se pudieron cargar las aulas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAulas();
    }, [useMySqlApi]);

    const validateAula = () => {
        if (!nombre.trim()) {
            toast({
                variant: "destructive",
                title: "Error de validación",
                description: "El nombre del aula es requerido.",
            });
            return false;
        }
        const capacidadNum = Number.parseInt(capacidad);
        if (isNaN(capacidadNum) || capacidadNum <= 0) {
            setShowCapacidadAlertDialog(true);
            return false;
        }
        return true;
    };

    const addAula = async () => {
        if (!validateAula()) return;

        const duplicateAula = aulas.find((a) => a.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
        if (duplicateAula) {
            setDuplicateAulaName(nombre);
            setShowDuplicateNameDialog(true);
            return;
        }

        setLoading(true);
        try {
            const aulaData = { nombre: nombre.trim(), capacidad: Number(capacidad), equipamiento: equipamiento.trim() };
            
            if (useMySqlApi) {
                const response = await fetch('/api/aulas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(aulaData),
                });
                const responseData = await response.json();
                if (!response.ok) {
                    throw new Error(responseData.error || 'Error al agregar el aula');
                }
            } else {
                const { error } = await supabase.from("aulas").insert([aulaData]);
                if (error) throw error;
            }
            
            await fetchAulas();
            setNombre("");
            setCapacidad("");
            setEquipamiento("");
            toast({ title: "Éxito", description: "Aula agregada correctamente." });

        } catch (err) {
            console.error("Error adding aula:", err);
            toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Error al agregar el aula." });
        } finally {
            setLoading(false);
        }
    };

    const updateAula = async (updatedAula: Aula) => {
        const duplicateAula = aulas.find(a => a.nombre.toLowerCase() === updatedAula.nombre.toLowerCase() && a.id !== updatedAula.id);
        if (duplicateAula) {
            setDuplicateAulaName(updatedAula.nombre);
            setShowDuplicateNameDialog(true);
            return;
        }

        setLoading(true);
        try {
            if (useMySqlApi) {
                const response = await fetch('/api/aulas', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedAula),
                });
                const responseData = await response.json();
                if (!response.ok) {
                    throw new Error(responseData.error || 'Error al actualizar el aula');
                }
            } else {
                const { error } = await supabase.from("aulas").update(updatedAula).eq("id", updatedAula.id);
                if (error) throw error;
            }
            
            await fetchAulas();
            handleCloseEditModal();
            toast({ title: "Éxito", description: "Aula actualizada correctamente." });

        } catch (err) {
            console.error("Error updating aula:", err);
            toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Error al actualizar el aula." });
        } finally {
            setLoading(false);
        }
    };

    const deleteAula = async (id: number) => {
        setLoading(true);
        try {
            if (useMySqlApi) {
                const response = await fetch(`/api/aulas?id=${id}`, {
                    method: 'DELETE',
                });
                const responseData = await response.json();
                if (!response.ok) {
                    throw new Error(responseData.error || 'Error al eliminar el aula');
                }
            } else {
                const { error } = await supabase.from("aulas").delete().eq("id", id);
                if (error) throw error;
            }
            
            await fetchAulas();
            toast({ title: "Éxito", description: "Aula eliminada correctamente." });

        } catch (err) {
            console.error("Error deleting aula:", err);
            toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Error al eliminar el aula." });
        } finally {
            setLoading(false);
            setShowDeleteConfirmDialog(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAula) {
            updateAula({
                ...editingAula,
                nombre: nombre.trim(),
                capacidad: Number(capacidad),
                equipamiento: equipamiento.trim(),
            });
        } else {
            addAula();
        }
    };
    
    const handleSaveEdit = (updatedAula: Aula) => {
        updateAula(updatedAula);
    };

    const handleEditAula = (aula: Aula) => {
        setEditingAula(aula);
        setNombre(aula.nombre);
        setCapacidad(String(aula.capacidad));
        setEquipamiento(aula.equipamiento);
        setIsEditModalOpen(true);
    };
    
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingAula(null);
        setNombre("");
        setCapacidad("");
        setEquipamiento("");
    };

    const confirmDeleteAula = (aula: Aula) => {
        setCurrentAulaInfo(aula);
        setShowDeleteConfirmDialog(true);
    };

    const columns: ColumnDef<Aula>[] = [
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
        accessorKey: "capacidad",
        header: "Capacidad",
        cell: ({ row }) => (
          <div className="flex items-center">
            <span className="text-sm">{row.original.capacidad} estudiantes</span>
          </div>
        ),
      },
      {
        accessorKey: "equipamiento",
        header: "Equipamiento",
        cell: ({ row }) => (
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground">{row.original.equipamiento}</span>
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const aula = row.original;
          return (
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEditAula(aula)}>
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => confirmDeleteAula(aula)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
          );
        },
      },
    ];

    const filteredAulas = aulas.filter(
        (aula) =>
          aula.nombre.toLowerCase().includes(filterAula.toLowerCase()) ||
          (aula.equipamiento && aula.equipamiento.toLowerCase().includes(filterAula.toLowerCase())),
      );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Gestión de Aulas</h2>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agregar Nueva Aula</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4">
              <label htmlFor="nombre" className="block text-sm font-medium text-muted-foreground mb-2">
                Nombre del aula
              </label>
              <Input
                id="nombre"
                placeholder="Ej: Aula Magna"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="h-10 w-full"
              />
            </div>
            <div className="md:col-span-3">
              <label htmlFor="capacidad" className="block text-sm font-medium text-muted-foreground mb-2">
                Capacidad
              </label>
              <Input
                id="capacidad"
                type="number"
                placeholder="Ej: 50"
                value={capacidad}
                onChange={(e) => setCapacidad(e.target.value)}
                min="1"
                className="h-10 w-full"
              />
            </div>
            <div className="md:col-span-3">
                <label htmlFor="equipamiento" className="block text-sm font-medium text-muted-foreground mb-2">
                  Equipamiento
                </label>
                <Input
                  id="equipamiento"
                  placeholder="Ej: Proyector, Pizarrón"
                  value={equipamiento}
                  onChange={(e) => setEquipamiento(e.target.value)}
                  className="h-10 w-full"
                />
            </div>
            <div className="md:col-span-2 flex items-end">
                <Button type="submit" className="h-10 w-full" disabled={loading}>
                  {loading ? 'Guardando...' : 'Agregar Aula'}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Aulas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
                placeholder="Buscar aulas por nombre o equipamiento..."
                value={filterAula}
                onChange={(e) => setFilterAula(e.target.value)}
                className="max-w-sm"
            />
            <div className="rounded-md border">
              <DataTable columns={columns} data={filteredAulas} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isEditModalOpen && (
        <EditModal 
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            aula={editingAula}
            onSave={handleSaveEdit}
        />
      )}

      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription className="pt-2">
              ¿Está seguro de que desea eliminar el aula **{currentAulaInfo?.nombre}**? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteAula(currentAulaInfo!.id)} disabled={loading}>
              {loading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={showDuplicateNameDialog} onOpenChange={setShowDuplicateNameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Nombre de aula duplicado
            </DialogTitle>
          </DialogHeader>
          <p className="py-4">Ya existe un aula con el nombre "{duplicateAulaName}". Por favor, elija un nombre diferente.</p>
          <DialogFooter>
            <Button onClick={() => setShowDuplicateNameDialog(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}