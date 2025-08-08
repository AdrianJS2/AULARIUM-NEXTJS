
"use client"

import { useEffect, useState } from "react"

type Carrera = { id: number; nombre: string }

export function useCarreras() {
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setIsLoading(true)
        const res = await fetch("/api/carreras")
        if (!res.ok) throw new Error("No autorizado o error al cargar carreras")
        const data = (await res.json()) as Carrera[]
        if (alive) setCarreras(data)
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Error")
      } finally {
        if (alive) setIsLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  return { carreras, isLoading, error }
}
