// components/ProfesorManagement.tsx
"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle, AlertTriangle } from "@/components/ui/alert"
import { DataTable } from "@/components/ui/data-table"
import { toast } from "@/components/ui/use-toast"
import { Upload, Search, UserPlus } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
// ... (otros imports como Dialog, etc., si los necesitas)

interface Profesor {
  id: string
  nombre: string
  email: string
  usuario_id?: string
}

export default function ProfesorManagement() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user, isAdmin } = useAuth()

  const fetchProfesores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/profesores');
      if (!response.ok) {
        throw new Error("Error al cargar los profesores");
      }
      const data = await response.json();
      setProfesores(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfesores();
  }, [fetchProfesores]);

  async function addProfesor() {
    if (!nombre || !email) {
      toast({ title: "Error", description: "Nombre y email son requeridos.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/profesores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo agregar el profesor.");
      }
      
      await fetchProfesores(); // Recargar la lista
      setNombre("");
      setEmail("");
      toast({ title: "Éxito", description: "Profesor agregado correctamente." });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const columns: ColumnDef<Profesor>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    // ... (puedes agregar la columna de acciones para editar/eliminar más adelante)
  ];

  const filteredProfesores = profesores.filter(
    (profesor) =>
      profesor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profesor.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Gestión de Profesores</h2>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
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
              {isLoading ? "Agregando..." : "Agregar Profesor"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Profesores</CardTitle>
            <div className="relative w-full sm:w-auto sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar profesor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <DataTable columns={columns} data={filteredProfesores} />
            )}
        </CardContent>
      </Card>
    </div>
  )
}