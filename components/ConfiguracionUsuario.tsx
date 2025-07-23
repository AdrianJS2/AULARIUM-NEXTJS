"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth" // Asegúrate que la ruta sea correcta
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"

const ConfiguracionUsuario: React.FC = () => {
  // Obtenemos 'user' y 'loading' de tu hook. No necesitamos más.
  const { user, loading } = useAuth(); 
  
  // ¡Importante! Necesitamos una forma de llamar a checkSession. 
  // Modificaremos useAuth para exponerla.
  // Por ahora, asumiremos que está disponible.
  const { checkSession } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword) {
      setPasswordError("Por favor complete ambos campos");
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar la contraseña');
      }

      setPasswordSuccess("Contraseña actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      
      // Llamamos a la función checkSession de tu hook para refrescar los datos.
      if (checkSession) {
          checkSession();
      }

    } catch (err: any) {
      console.error("Error changing password:", err);
      setPasswordError(err.message || "Error al cambiar la contraseña");
    }
  };

  // El resto del JSX permanece exactamente igual
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Configuración</h2>
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : user ? (
          <>
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="text-lg font-medium border-l-4 border-primary pl-3 mb-4">Información de Usuario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre:</p>
                  <p className="font-medium">{user.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email:</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rol:</p>
                  <p className="font-medium">
                    {user.rol === "admin" ? "Administrador" : user.rol === "director" ? "Director" : "Usuario"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-card">
              <h3 className="text-lg font-medium border-l-4 border-primary pl-3 mb-4">Cambiar Contraseña</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && <div className="text-red-500 p-3 bg-red-50 rounded-md">{passwordError}</div>}
                {passwordSuccess && <div className="text-green-500 p-3 bg-green-50 rounded-md">{passwordSuccess}</div>}

                <div>
                  <label htmlFor="currentPassword"
                         className="block text-sm font-medium mb-1">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </Button>
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword"
                         className="block text-sm font-medium mb-1">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </Button>
                  </div>
                </div>

                <Button type="submit"
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                  Actualizar Contraseña
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="text-red-500 p-3 bg-red-50 rounded-md">No se pudo cargar la información del usuario.</div>
        )}
      </div>
    </div>
  );
};

export default ConfiguracionUsuario;