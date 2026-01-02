"use client"

import { useEffect, useState, useCallback } from "react"
import { Play, Pause, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Hora {
    id: string
    dataInicio: string
    status: string
    segundos: number | null
}

interface CronometroProps {
    servicoId: string
    horaAtiva?: Hora | null
    onUpdate?: () => void
}

function formatTempo(segundos: number): string {
    const h = Math.floor(segundos / 3600)
    const m = Math.floor((segundos % 3600) / 60)
    const s = segundos % 60

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export function Cronometro({ servicoId, horaAtiva, onUpdate }: CronometroProps) {
    const [tempo, setTempo] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [horaId, setHoraId] = useState<string | null>(horaAtiva?.id ?? null)

    // Calcula tempo inicial baseado na hora ativa
    const calcularTempoInicial = useCallback(() => {
        if (!horaAtiva) return 0
        const inicio = new Date(horaAtiva.dataInicio).getTime()
        const agora = Date.now()
        const segundosPassados = Math.floor((agora - inicio) / 1000)
        return segundosPassados
    }, [horaAtiva])

    useEffect(() => {
        if (horaAtiva) {
            setHoraId(horaAtiva.id)
            if (horaAtiva.status === "ATIVA") {
                setTempo(calcularTempoInicial())
                setIsRunning(true)
            } else if (horaAtiva.status === "PAUSADA") {
                setTempo(horaAtiva.segundos ?? 0)
                setIsRunning(false)
            }
        } else {
            setHoraId(null)
            setTempo(0)
            setIsRunning(false)
        }
    }, [horaAtiva, calcularTempoInicial])

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (isRunning) {
            interval = setInterval(() => {
                setTempo((prev) => prev + 1)
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isRunning])

    async function iniciar() {
        setIsLoading(true)
        try {
            const response = await fetch("/api/hora", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ servicoId }),
            })

            if (response.ok) {
                const data = await response.json()
                setHoraId(data.id)
                setTempo(0)
                setIsRunning(true)
                onUpdate?.()
            }
        } catch (error) {
            console.error("Erro ao iniciar cronômetro:", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function pausar() {
        if (!horaId) return
        setIsLoading(true)
        try {
            const response = await fetch(`/api/hora/${horaId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "PAUSADA" }),
            })

            if (response.ok) {
                setIsRunning(false)
                onUpdate?.()
            }
        } catch (error) {
            console.error("Erro ao pausar cronômetro:", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function retomar() {
        if (!horaId) return
        setIsLoading(true)
        try {
            const response = await fetch(`/api/hora/${horaId}/retomar`, {
                method: "POST",
            })

            if (response.ok) {
                setIsRunning(true)
                onUpdate?.()
            }
        } catch (error) {
            console.error("Erro ao retomar cronômetro:", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function finalizar() {
        if (!horaId) return
        setIsLoading(true)
        try {
            const response = await fetch(`/api/hora/${horaId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "FINALIZADA" }),
            })

            if (response.ok) {
                setIsRunning(false)
                setHoraId(null)
                setTempo(0)
                onUpdate?.()
            }
        } catch (error) {
            console.error("Erro ao finalizar cronômetro:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const temHoraAtiva = horaAtiva && horaAtiva.status !== "FINALIZADA"

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="text-4xl font-mono font-bold tabular-nums">
                        {formatTempo(tempo)}
                    </div>

                    <div className="flex gap-2">
                        {!temHoraAtiva ? (
                            <Button
                                onClick={iniciar}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <Play className="h-4 w-4" />
                                Iniciar
                            </Button>
                        ) : (
                            <>
                                {isRunning ? (
                                    <Button
                                        onClick={pausar}
                                        disabled={isLoading}
                                        variant="secondary"
                                        className="gap-2"
                                    >
                                        <Pause className="h-4 w-4" />
                                        Pausar
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={retomar}
                                        disabled={isLoading}
                                        className="gap-2"
                                    >
                                        <Play className="h-4 w-4" />
                                        Retomar
                                    </Button>
                                )}
                                <Button
                                    onClick={finalizar}
                                    disabled={isLoading}
                                    variant="destructive"
                                    className="gap-2"
                                >
                                    <Square className="h-4 w-4" />
                                    Finalizar
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
