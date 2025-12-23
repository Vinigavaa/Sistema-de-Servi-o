"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { loginWithGoogle } from "./_actions/login";
import { Loader2, Chrome } from "lucide-react";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    async function handleLogin() {
        setIsLoading(true);
        try {
            await loginWithGoogle();
        } catch {
            setIsLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
            <Card className="w-full max-w-[400px] shadow-lg">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={64}
                            height={64}
                            className="text-foreground"
                        />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Controle seu tempo
                        </CardTitle>
                        <CardDescription className="text-base">
                            Faça login para continuar
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full h-12 text-base font-medium"
                        onClick={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="size-5 animate-spin" />
                        ) : (
                            <Chrome className="size-5" />
                        )}
                        {isLoading ? "Conectando..." : "Continuar com Google"}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                        Usamos sua conta Google apenas para autenticação.
                    </p>
                </CardContent>

                <CardFooter className="flex-col gap-2 text-center">
                    <p className="text-xs text-muted-foreground">
                        Ao continuar, você concorda com nossos{" "}
                        <a href="/termos" className="underline hover:text-foreground">
                            Termos de Uso
                        </a>{" "}
                        e{" "}
                        <a href="/privacidade" className="underline hover:text-foreground">
                            Política de Privacidade
                        </a>
                    </p>
                </CardFooter>
            </Card>
        </main>
    );
}