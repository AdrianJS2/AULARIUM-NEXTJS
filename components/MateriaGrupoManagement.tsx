// components/MateriaGrupoManagement.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle, AlertTriangle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Pencil, Trash2, Plus, BookOpen } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

// Interfaces
interface Profesor { id: number; nombre: string; }
interface Materia { id: number; nombre: string; profesor_id: number | null; }
interface Grupo { id: number; materia_id: number; numero: string; alumnos: number; turno: "MAÑANA" | "TARDE"; horarios: any[]; }
interface Props { selectedPeriod: string; }

export default function MateriaGrupoManagement({ selectedPeriod }: Props) {
    const [profesores, setProfesores] = useState<Profesor[]>([]);
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados de formularios
    const [nombreMateria, setNombreMateria] = useState("");
    const [profesorId, setProfesorId] = useState<string | null>(null);
    const [selectedMateriaId, setSelectedMateriaId] = useState<number | null>(null);
    const [grupoNumero, setGrupoNumero] = useState("");
    const [grupoAlumnos, setGrupoAlumnos] = useState("");
    const [grupoTurno, setGrupoTurno] = useState<"MAÑANA" | "TARDE">("MAÑANA");
    const [horarios, setHorarios] = useState<{ dia: string; hora_inicio: string; hora_fin: string; }[]>([]);


    // Estados de UI
    const [filterMateria, setFilterMateria] = useState("");
    const [materiaToDelete, setMateriaToDelete] = useState<number | null>(null);
    const [isDeleteMateriaModalOpen, setIsDeleteMateriaModalOpen] = useState(false);
    const [isAddGrupoModalOpen, setIsAddGrupoModalOpen] = useState(false);

    const { user, userCarreraId } = useAuth();

    const fetchData = useCallback(async () => {
        if (!selectedPeriod) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/gestion-data/${selectedPeriod}`);
            if (!response.ok) throw new Error("Error al cargar los datos");
            const data = await response.json();

            setProfesores(data.profesores || []);
            setMaterias(data.materias || []);
            const parsedGrupos = (data.grupos || []).map((g: Grupo) => ({ ...g, horarios: Array.isArray(g.horarios) ? g.horarios : JSON.parse(g.horarios || "[]") }));
            setGrupos(parsedGrupos);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod]);

    useEffect(() => { fetchData(); }, [fetchData]);

    async function addMateria() {
        if (!nombreMateria.trim()) {
            toast({ title: "Error", description: "El nombre es requerido.", variant: "destructive" });
            return;
        }

        try {
            const response = await fetch('/api/materias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nombreMateria,
                    profesor_id: profesorId === "pendiente" || !profesorId ? null : Number(profesorId),
                    periodo_id: selectedPeriod,
                    carrera_id: userCarreraId,
                }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }
            await fetchData();
            setNombreMateria("");
            setProfesorId(null);
            toast({ title: "Éxito", description: "Materia agregada." });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    }

    const confirmDeleteMateria = (id: number) => {
        setMateriaToDelete(id);
        setIsDeleteMateriaModalOpen(true);
    };

    async function executeDeleteMateria() {
        if (!materiaToDelete) return;
        try {
            const response = await fetch('/api/materias', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: materiaToDelete, periodo_id: selectedPeriod }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }
            await fetchData();
            toast({ title: "Éxito", description: "Materia eliminada." });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsDeleteMateriaModalOpen(false);
        }
    }

    const openAddGrupoModal = (materiaId: number) => {
        setSelectedMateriaId(materiaId);
        setIsAddGrupoModalOpen(true);
    };
    
    // (Aquí puedes añadir la lógica para los modales de agregar/editar grupos y horarios)
    // ...

    const columnsMaterias: ColumnDef<Materia>[] = [
        { accessorKey: "nombre", header: "Nombre" },
        {
            accessorKey: "profesor_id",
            header: "Profesor",
            cell: ({ row }) => {
                const pId = row.original.profesor_id;
                const profesor = profesores.find((p) => p.id === pId);
                return profesor ? profesor.nombre : <span className="text-gray-400">Pendiente</span>;
            },
        },
        {
            id: "grupos",
            header: "Grupos",
            cell: ({row}) => {
                const materiaId = row.original.id;
                const gruposDeMateria = grupos.filter(g => g.materia_id === materiaId).length;
                return <span>{gruposDeMateria}</span>
            }
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openAddGrupoModal(row.original.id)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Grupo
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { /* Lógica de editar materia */ }}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => confirmDeleteMateria(row.original.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                    </Button>
                </div>
            ),
        },
    ];

    const filteredMaterias = materias.filter((materia) =>
        materia.nombre.toLowerCase().includes(filterMateria.toLowerCase()),
    );
    
    if (loading) return <div className="text-center p-8">Cargando...</div>;
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary">Gestión de Materias y Grupos</h2>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            
            <Card>
                <CardHeader><CardTitle>Agregar Materia</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input placeholder="Nombre de la materia" value={nombreMateria} onChange={(e) => setNombreMateria(e.target.value)} />
                        <Select value={profesorId || ""} onValueChange={setProfesorId}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar profesor" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pendiente">Pendiente por asignar</SelectItem>
                                {profesores.map((profesor) => (
                                    <SelectItem key={profesor.id} value={profesor.id.toString()}>{profesor.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={addMateria}><Plus className="h-4 w-4 mr-2"/>Agregar Materia</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Materias</CardTitle></CardHeader>
                <CardContent>
                    <Input placeholder="Buscar materias..." value={filterMateria} onChange={(e) => setFilterMateria(e.target.value)} className="max-w-sm mb-4"/>
                    <DataTable columns={columnsMaterias} data={filteredMaterias} />
                </CardContent>
            </Card>

            <Dialog open={isDeleteMateriaModalOpen} onOpenChange={setIsDeleteMateriaModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Confirmar eliminación</DialogTitle></DialogHeader>
                    <p>¿Seguro que deseas eliminar esta materia? Se eliminarán todos sus grupos y asignaciones.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteMateriaModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={executeDeleteMateria}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}