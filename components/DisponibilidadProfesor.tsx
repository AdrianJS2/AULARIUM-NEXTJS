"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { featureFlags } from '@/lib/config';
import { toast } from "@/components/ui/use-toast"
import { Clock, Calendar, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Días de la semana (sin sábado)
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

// Horas del día (7:00 AM a 21:00 PM)
const HORAS = Array.from({ length: 15 }, (_, i) => {
  const hora = i + 7
  return `${hora.toString().padStart(2, "0")}:00`
})

interface DisponibilidadProfesorProps {
  profesorId: string
  onSave?: () => void
  onCancel?: () => void
  readOnly?: boolean
}

export default function DisponibilidadProfesor({
  profesorId,
  onSave,
  onCancel,
  readOnly = false,
}: DisponibilidadProfesorProps) {
  const useMySqlApi = featureFlags.profesores === 'mysql'; // Establecer useMySqlApi en función de featureFlags.profesores
  const [disponibilidad, setDisponibilidad] = useState<Record<string, Record<string, boolean>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [nombreProfesor, setNombreProfesor] = useState("")
  const [resumen, setResumen] = useState<{ total: number; porDia: Record<string, number> }>({
    total: 0,
    porDia: {},
  })

  // Cargar la disponibilidad actual del profesor
 // REEMPLAZA TU useEffect ACTUAL CON ESTE
useEffect(() => {
  async function cargarDisponibilidad() {
    if (!profesorId) return;
    setIsLoading(true);
    try {
      let profesor: { nombre: string; disponibilidad: any } | null = null;

      // --- Lógica condicional ---
      if (useMySqlApi) {
        const response = await fetch(`/api/profesores/disponibilidad?id=${profesorId}`);
        if (!response.ok) throw new Error("No se pudo cargar desde la API");
        profesor = await response.json();
      } else {
        const { data, error } = await supabase.from("profesores").select("nombre, disponibilidad").eq("id", profesorId).single();
        if (error) throw error;
        profesor = data;
      }

      setNombreProfesor(profesor?.nombre || "");
      const disponibilidadGuardada = profesor?.disponibilidad || {};
      const disponibilidadInicial: Record<string, Record<string, boolean>> = {};
      DIAS.forEach((dia) => {
        disponibilidadInicial[dia] = {};
        HORAS.forEach((hora) => {
          disponibilidadInicial[dia][hora] = disponibilidadGuardada[dia]?.[hora] === true;
        });
      });

      setDisponibilidad(disponibilidadInicial);
      actualizarResumen(disponibilidadInicial);

    } catch (error) {
      console.error("Error al cargar disponibilidad:", error);
      toast({ title: "Error", description: "No se pudo cargar la disponibilidad.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }
  cargarDisponibilidad();
}, [profesorId, useMySqlApi]); // <-- AÑADE useMySqlApi A LAS DEPENDENCIAS

  // Actualizar el resumen de disponibilidad
  const actualizarResumen = (disp: Record<string, Record<string, boolean>>) => {
    let total = 0
    const porDia: Record<string, number> = {}

    DIAS.forEach((dia) => {
      let horasDisponibles = 0
      HORAS.forEach((hora) => {
        if (disp[dia]?.[hora] === true) {
          horasDisponibles++
          total++
        }
      })
      porDia[dia] = horasDisponibles
    })

    setResumen({ total, porDia })
  }

  // Manejar cambio en un checkbox
  const handleCheckboxChange = (dia: string, hora: string, checked: boolean) => {
    if (readOnly) return

    const nuevaDisponibilidad = {
      ...disponibilidad,
      [dia]: {
        ...disponibilidad[dia],
        [hora]: checked,
      },
    }

    setDisponibilidad(nuevaDisponibilidad)
    actualizarResumen(nuevaDisponibilidad)
  }

  // Seleccionar/deseleccionar toda una fila (día)
  const handleSelectRow = (dia: string, checked: boolean) => {
    if (readOnly) return

    const nuevaDisponibilidad = {
      ...disponibilidad,
      [dia]: Object.keys(disponibilidad[dia]).reduce(
        (acc, hora) => {
          acc[hora] = checked
          return acc
        },
        {} as Record<string, boolean>,
      ),
    }

    setDisponibilidad(nuevaDisponibilidad)
    actualizarResumen(nuevaDisponibilidad)
  }

  // Seleccionar/deseleccionar toda una columna (hora)
  const handleSelectColumn = (hora: string, checked: boolean) => {
    if (readOnly) return

    const newDisp = { ...disponibilidad }
    DIAS.forEach((dia) => {
      newDisp[dia] = {
        ...newDisp[dia],
        [hora]: checked,
      }
    })

    setDisponibilidad(newDisp)
    actualizarResumen(newDisp)
  }

  // Guardar la disponibilidad
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { profesorId, disponibilidad };
      
      // --- Lógica condicional ---
      if (useMySqlApi) {
        const response = await fetch('/api/profesores/disponibilidad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Error al guardar en la API");
      } else {
        const { error } = await supabase.from("profesores").update({ disponibilidad }).eq("id", profesorId);
        if (error) throw error;
      }
  
      toast({ title: "Éxito", description: "Disponibilidad guardada correctamente." });
      if (onSave) onSave();
  
    } catch (error) {
      console.error("Error al guardar disponibilidad:", error);
      toast({ title: "Error", description: "No se pudo guardar la disponibilidad.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Verificar si toda una fila está seleccionada
  const isRowSelected = (dia: string) => {
    return Object.values(disponibilidad[dia] || {}).every((v) => v)
  }

  // Verificar si toda una columna está seleccionada
  const isColumnSelected = (hora: string) => {
    return DIAS.every((dia) => disponibilidad[dia]?.[hora])
  }

  // Verificar si alguna celda de una fila está seleccionada
  const isRowPartiallySelected = (dia: string) => {
    const values = Object.values(disponibilidad[dia] || {})
    return values.some((v) => v) && !values.every((v) => v)
  }

  // Verificar si alguna celda de una columna está seleccionada
  const isColumnPartiallySelected = (hora: string) => {
    const selected = DIAS.some((dia) => disponibilidad[dia]?.[hora])
    return selected && !isColumnSelected(hora)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Disponibilidad de {nombreProfesor}
            </CardTitle>
            <CardDescription>
              {readOnly
                ? "Horarios en los que el profesor está disponible"
                : "Seleccione los horarios en los que el profesor está disponible"}
            </CardDescription>
          </div>
          <Badge variant="outline" className="px-3 py-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{resumen.total} horas disponibles</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Resumen por día */}
          <div className="grid grid-cols-5 gap-2">
            {DIAS.map((dia) => (
              <div key={`resumen-${dia}`} className="flex flex-col items-center p-2 rounded-md bg-muted/40">
                <span className="text-sm font-medium">{dia}</span>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{resumen.porDia[dia] || 0} horas</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla de disponibilidad */}
          <div className="border rounded-md overflow-auto bg-white dark:bg-gray-950">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-2 border-b border-r font-medium text-left">Día / Hora</th>
                  {HORAS.map((hora) => (
                    <th key={hora} className="p-2 border-b border-r text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium">{hora}</span>
                        {!readOnly && (
                          <Checkbox
                            checked={isColumnSelected(hora)}
                            className={`mt-1 ${isColumnPartiallySelected(hora) ? "data-[state=checked]:bg-primary/50" : ""}`}
                            onCheckedChange={(checked) => handleSelectColumn(hora, !!checked)}
                            disabled={readOnly}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIAS.map((dia) => (
                  <tr key={dia} className="hover:bg-muted/30">
                    <td className="p-2 border-b border-r font-medium">
                      <div className="flex items-center gap-2">
                        {!readOnly && (
                          <Checkbox
                            checked={isRowSelected(dia)}
                            className={isRowPartiallySelected(dia) ? "data-[state=checked]:bg-primary/50" : ""}
                            onCheckedChange={(checked) => handleSelectRow(dia, !!checked)}
                            disabled={readOnly}
                          />
                        )}
                        {dia}
                      </div>
                    </td>
                    {HORAS.map((hora) => (
                      <td key={`${dia}-${hora}`} className="p-2 border-b border-r text-center">
                        {readOnly ? (
                          disponibilidad[dia]?.[hora] ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <Checkbox
                            checked={disponibilidad[dia]?.[hora] || false}
                            onCheckedChange={(checked) => handleCheckboxChange(dia, hora, !!checked)}
                            disabled={readOnly}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botones de acción */}
          {!readOnly && (
            <div className="flex justify-end gap-2 mt-4">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Guardar disponibilidad
                  </>
                )}
              </Button>
            </div>
          )}
          {readOnly && onCancel && (
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={onCancel}>
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
