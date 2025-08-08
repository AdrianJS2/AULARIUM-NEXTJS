// components/carrera-select.tsx
"use client"

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useCarreras } from "@/lib/useCarreras"

export default function CarreraSelect({
  value,
  onChange,
  placeholder = "Selecciona carrera (opcional)",
}: {
  value: number | null
  onChange: (id: number | null) => void
  placeholder?: string
}) {
  const { carreras, isLoading, error } = useCarreras()

  return (
    <Select onValueChange={(val) => onChange(val === "none" ? null : Number(val))} value={value ? String(value) : "none"}>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar carrera" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">N/A</SelectItem>
    {carreras.map((carrera) => (
      <SelectItem key={carrera.id} value={String(carrera.id)}>
        {carrera.nombre}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
  )
}
