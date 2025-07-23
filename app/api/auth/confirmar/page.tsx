"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader } from "lucide-react";

// Componente principal que se exporta, envuelto en Suspense
export default function ConfirmarPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <ConfirmarCuenta />
        </Suspense>
    );
}

// Componente que contiene la lógica
function ConfirmarCuenta() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState("Verificando tu cuenta, por favor espera...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Token de verificación no encontrado o inválido.");
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await fetch('/api/auth/confirmar-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || "El enlace de verificación ha expirado o no es válido.");
                }

                setStatus("success");
                setMessage("¡Tu cuenta ha sido activada exitosamente!");

                // Redirigir al login después de 3 segundos
                setTimeout(() => {
                    router.push('/'); // Redirige a la página de login
                }, 3000);

            } catch (error: any) {
                setStatus("error");
                setMessage(error.message);
            }
        };

        verifyToken();
    }, [token, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {status === 'verifying' && "Verificando tu Cuenta"}
                        {status === 'success' && "¡Cuenta Verificada!"}
                        {status === 'error' && "Error de Verificación"}
                    </CardTitle>
                    <CardDescription>
                         {message}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center p-6">
                    {status === 'verifying' && <Loader className="h-16 w-16 text-primary animate-spin" />}
                    {status === 'success' && <CheckCircle className="h-16 w-16 text-green-500" />}
                    {status === 'error' && <XCircle className="h-16 w-16 text-red-500" />}
                </CardContent>
                <CardFooter>
                     <Button asChild className="w-full">
                        <Link href="/">
                           {status === 'success' ? "Ir a Iniciar Sesión" : "Volver al Inicio"}
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// Componente de fallback para Suspense
function LoadingState() {
    return (
         <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Loader className="h-16 w-16 text-primary animate-spin" />
        </div>
    )
}