"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"

import { lancarHorasSchema, LancarHorasInput } from "@/lib/validations/servico"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"

interface LancarHorasProps {
    servicoId: string
    onSuccess?: () => void
}

export function LancarHoras({ servicoId, onSuccess }: LancarHorasProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const form = useForm<LancarHorasInput>({
        resolver: zodResolver(lancarHorasSchema),
        defaultValues: {
            servicoId,
            segundos: 0,
            descricao: "",
        },
    })

    // Estados locais para horas e minutos (mais amigável)
    const [horas, setHoras] = useState(0)
    const [minutos, setMinutos] = useState(0)

    async function onSubmit() {
        const segundos = (horas * 3600) + (minutos * 60)

        if (segundos <= 0) {
            setError("Informe pelo menos 1 minuto")
            return
        }

        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const response = await fetch("/api/hora/lancar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    servicoId,
                    segundos,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Erro ao lançar horas")
            }

            setSuccess(true)
            setHoras(0)
            setMinutos(0)
            form.reset()
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao lançar horas")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Lançar Horas Manualmente</CardTitle>
                <CardDescription>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormItem>
                                <FormLabel>Horas</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={23}
                                        value={horas}
                                        onChange={(e) => setHoras(parseInt(e.target.value) || 0)}
                                        placeholder="0"
                                    />
                                </FormControl>
                            </FormItem>

                            <FormItem>
                                <FormLabel>Minutos</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={59}
                                        value={minutos}
                                        onChange={(e) => setMinutos(parseInt(e.target.value) || 0)}
                                        placeholder="0"
                                    />
                                </FormControl>
                            </FormItem>
                        </div>

                        <FormDescription>
                            Total: {horas}h {minutos}min ({(horas * 60) + minutos} minutos)
                        </FormDescription>

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        {success && (
                            <p className="text-sm text-green-600">Horas lançadas com sucesso!</p>
                        )}

                        <Button type="submit" disabled={isLoading} className="w-full gap-2">
                            <Plus className="h-4 w-4" />
                            {isLoading ? "Lançando..." : "Lançar Horas"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
