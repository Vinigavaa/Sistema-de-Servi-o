"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface LancarHorasProps {
    servicoId: string
    onSuccess?: () => void
}

export function LancarHoras({ servicoId, onSuccess }: LancarHorasProps) {
    const [horas, setHoras] = useState(0)
    const [minutos, setMinutos] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
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
                body: JSON.stringify({ servicoId, segundos }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Erro ao lançar horas")
            }

            setSuccess(true)
            setHoras(0)
            setMinutos(0)
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao lançar horas")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="h-full">
            <CardContent className="pt-6 flex flex-col justify-center min-h-[200px]">
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Horas</Label>
                            <Input
                                type="number"
                                min={0}
                                max={23}
                                value={horas}
                                onChange={(e) => setHoras(parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Minutos</Label>
                            <Input
                                type="number"
                                min={0}
                                max={59}
                                value={minutos}
                                onChange={(e) => setMinutos(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Total: {horas}h {minutos}min
                    </p>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {success && <p className="text-sm text-green-600">Horas lançadas!</p>}

                    <Button type="submit" disabled={isLoading} className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        {isLoading ? "Lançando..." : "Lançar Horas"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
