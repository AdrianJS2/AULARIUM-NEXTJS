// components/AsignacionAulas.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle, AlertTriangle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth" // Usamos el nuevo hook de NextAuth
import HorarioSemanal from "./HorarioSemanal"
import { DndContext, closestCenter } from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { useToast } from "@/components/ui/use-toast"
import { FileDown } from "lucide-react"

// Las interfaces no cambian
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
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { toast } = useToast()
  const { user, isAdmin, userRole } = useAuth(); // Obtenemos el estado de autenticación

  const fetchData = useCallback(async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/horarios-data/${selectedPeriod}`);
      if (!response.ok) {
        throw new Error("Error al cargar los datos del horario");
      }
      const data = await response.json();

      setAulas(data.aulas || []);
      setMaterias(data.materias || []);
      const parsedGrupos = (data.grupos || []).map((grupo: Grupo) => ({
        ...grupo,
        horarios: Array.isArray(grupo.horarios) ? grupo.horarios : JSON.parse(grupo.horarios || "[]"),
      }));
      setGrupos(parsedGrupos);
      setAsignaciones(data.asignaciones || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  async function asignarAulas() {
    // ... La lógica interna de esta función no necesita cambiar por ahora ...
    // Seguirá llamando a las rutas /api/asignar-aulas/[periodo] que ya refactorizamos.
  }

  async function deshacerAsignacion() {
    // ... La lógica interna de esta función tampoco cambia ...
    // Ya la refactorizamos para que no espere un retorno de datos.
    await fetchData(); // Simplemente recargamos los datos.
  }

  const handleDragEnd = async (event: any) => {
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden modificar las asignaciones de aulas",
        variant: "destructive",
      })
      return
    }
    // ...el resto de la lógica de drag-and-drop no cambia.
  }

  // El resto del componente (el JSX) permanece igual.
  
  // ... (pega aquí el resto de tu JSX sin cambios)

  return (
    <Card>
      {/* ... Tu JSX aquí ... */}
    </Card>
  )
}