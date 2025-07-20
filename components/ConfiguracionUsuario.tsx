"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth" // La única fuente de datos del usuario
import { Eye, EyeOff, AlertTriangle } from "lucide-react"

const ConfiguracionUsuario: React.FC = () => {
    // 1. OBTENEMOS EL USUARIO Y EL ESTADO DE CARGA REAL DEL HOOK
    const { user, loading: authLoading } = useAuth();

    // El estado local ahora es SOLO para el formulario de contraseña
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Esta función ya es correcta y usa tu nueva API
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);
        setIsSubmitting(true);

        if (!currentPassword || !newPassword) {
            setPasswordError("Por favor complete ambos campos");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    currentPassword,
                    newPassword
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Error al cambiar la contraseña");
            }

            setPasswordSuccess("Contraseña actualizada correctamente");
            setCurrentPassword("");
            setNewPassword("");
        } catch (err: any) {
            setPasswordError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-semibold">Configuración</h2>
            <div className="space-y-6">
                {/* 2. USAMOS 'authLoading' PARA MOSTRAR EL SPINNER */}
                {authLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    // Solo mostramos el contenido si el usuario ha cargado
                    user && (
                        <>
                            <div className="border rounded-lg p-6 bg-card">
                                <h3 className="text-lg font-medium border-l-4 border-primary pl-3 mb-4">Información de Usuario</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nombre:</p>
                                        {/* 3. MOSTRAMOS LOS DATOS DE 'user', NO DE 'userData' */}
                                        <p className="font-medium">{user.nombre}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email:</p>
                                        <p className="font-medium">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Rol:</p>
                                        <p className="font-medium capitalize">
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
                                        <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                                            Contraseña Actual
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="currentPassword"
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full p-2 border rounded-md"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                                            Nueva Contraseña
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="newPassword"
                                                type={showNewPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full p-2 border rounded-md"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90" disabled={isSubmitting}>
                                        {isSubmitting ? "Actualizando..." : "Actualizar Contraseña"}
                                    </button>
                                </form>
                            </div>
                        </>
                    )
                )}
            </div>
        </div>
    );
};

export default ConfiguracionUsuario;