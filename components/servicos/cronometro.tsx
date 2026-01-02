"use client"

import { useEffect, useState } from "react"
import { Play, Pause, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface CronometroProps {
    servicoId: string
    horaAtiva?: { id: string; dataInicio: string; status: string; segundos: number | null } | null
    onUpdate?: () => void
}

const formatTempo = (s: number) =>
    `${Math.floor(s / 3600).toString().padStart(2, "0")}:${Math.floor((s % 3600) / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`

export function Cronometro({ servicoId, horaAtiva, onUpdate }: CronometroProps) {
    const [tempo, setTempo] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const horaId = horaAtiva?.id ?? null

    useEffect(() => {
        if (!horaAtiva) {
            setTempo(0)
            setIsRunning(false)
            return
        }

        if (horaAtiva.status === "ATIVA") {
            setTempo(Math.floor((Date.now() - new Date(horaAtiva.dataInicio).getTime()) / 1000))
            setIsRunning(true)
        } else if (horaAtiva.status === "PAUSADA") {
            setTempo(horaAtiva.segundos ?? 0)
            setIsRunning(false)
        }
    }, [horaAtiva])

    useEffect(() => {
        if (!isRunning) return
        const interval = setInterval(() => setTempo(t => t + 1), 1000)
        return () => clearInterval(interval)
    }, [isRunning])

    const callApi = async (url: string, options?: RequestInit) => {
        setIsLoading(true)
        try {
            const res = await fetch(url, options)
            if (res.ok) onUpdate?.()
            return res.ok
        } finally {
            setIsLoading(false)
        }
    }

    const iniciar = () => callApi("/api/hora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicoId }),
    })

    const pausar = () => horaId && callApi(`/api/hora/${horaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAUSADA" }),
    })

    const retomar = () => horaId && callApi(`/api/hora/${horaId}/retomar`, { method: "POST" })

    const finalizar = () => horaId && callApi(`/api/hora/${horaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FINALIZADA" }),
    })

    const temHoraAtiva = horaAtiva && horaAtiva.status !== "FINALIZADA"

    return (
        <Card className="h-full">
            <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                <div className="text-4xl font-mono font-bold tabular-nums">
                    {formatTempo(tempo)}
                </div>

                <div className="flex gap-2">
                    {!temHoraAtiva ? (
                        <Button onClick={iniciar} disabled={isLoading} className="gap-2">
                            <Play className="h-4 w-4" />
                            Iniciar
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={isRunning ? pausar : retomar}
                                disabled={isLoading}
                                variant={isRunning ? "secondary" : "default"}
                                className="gap-2"
                            >
                                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                {isRunning ? "Pausar" : "Retomar"}
                            </Button>
                            <Button onClick={finalizar} disabled={isLoading} variant="destructive" className="gap-2">
                                <Square className="h-4 w-4" />
                                Finalizar
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
