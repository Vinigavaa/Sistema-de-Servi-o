"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Pencil, Clock, Calendar, Play, Pause, Square } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Cronometro } from "@/components/servicos/cronometro"
import { LancarHoras } from "@/components/servicos/lancar-horas"

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    EM_ABERTO: { label: "Em Aberto", variant: "outline" },
    FAZENDO: { label: "Fazendo", variant: "default" },
    TESTANDO: { label: "Testando", variant: "secondary" },
    CONCLUIDO: { label: "Concluído", variant: "secondary" },
}

const STATUS_HORA_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    ATIVA: { label: "Ativa", icon: <Play className="h-3 w-3" />, color: "text-green-600" },
    PAUSADA: { label: "Pausada", icon: <Pause className="h-3 w-3" />, color: "text-yellow-600" },
    FINALIZADA: { label: "Finalizada", icon: <Square className="h-3 w-3" />, color: "text-muted-foreground" },
}

interface Hora {
    id: string
    dataInicio: string
    dataFim: string | null
    segundos: number | null
    status: string
}

interface Servico {
    id: string
    nome: string
    descricao: string
    datahora: string
    status: string
    faturado: boolean
    criado_em: string
    finalizado_em: string | null
    tempoTotal: number
    horas: Hora[]
}

function formatTempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60

    if (horas === 0 && minutos === 0) return `${segs}s`
    if (horas === 0) return `${minutos}min ${segs}s`
    return `${horas}h ${minutos}min`
}

function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export default function ServicoDetalhesPage() {
    const params = useParams()
    const router = useRouter()
    const [servico, setServico] = useState<Servico | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchServico = useCallback(async () => {
        try {
            const response = await fetch(`/api/servico/${params.id}`)
            if (!response.ok) {
                if (response.status === 404) {
                    router.push("/servicos")
                    return
                }
                throw new Error("Erro ao carregar serviço")
            }
            const data = await response.json()
            setServico(data)
        } catch (err) {
            setError("Não foi possível carregar o serviço.")
        } finally {
            setLoading(false)
        }
    }, [params.id, router])

    useEffect(() => {
        if (params.id) {
            fetchServico()
        }
    }, [params.id, fetchServico])

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        )
    }

    if (error || !servico) {
        return (
            <div className="p-6">
                <div className="text-center py-10">
                    <p className="text-destructive">{error || "Serviço não encontrado"}</p>
                </div>
            </div>
        )
    }

    const statusConfig = STATUS_CONFIG[servico.status] ?? STATUS_CONFIG.EM_ABERTO
    const horaAtiva = servico.horas.find(h => h.status === "ATIVA" || h.status === "PAUSADA")

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/servicos">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">{servico.nome}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                        </Badge>
                        {servico.faturado && (
                            <Badge variant="default" className="bg-green-600">
                                Faturado
                            </Badge>
                        )}
                    </div>
                </div>
                <Button variant="outline" asChild>
                    <Link href={`/servicos/${servico.id}/editar`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                    </Link>
                </Button>
            </div>

            {/* Cards de resumo */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Tempo Total</CardDescription>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            {formatTempo(servico.tempoTotal)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Data do Serviço</CardDescription>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            {format(new Date(servico.datahora), "dd/MM/yyyy", { locale: ptBR })}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Criado em</CardDescription>
                        <CardTitle className="text-lg">
                            {format(new Date(servico.criado_em), "dd/MM/yyyy", { locale: ptBR })}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Sessões</CardDescription>
                        <CardTitle className="text-2xl">
                            {servico.horas.length}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {servico.descricao && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Descrição</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                            {servico.descricao}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Cronômetro e Lançar Horas */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Cronômetro</h2>
                    <Cronometro
                        servicoId={servico.id}
                        horaAtiva={horaAtiva}
                        onUpdate={fetchServico}
                    />
                </div>
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Lançamento Manual</h2>
                    <LancarHoras
                        servicoId={servico.id}
                        onSuccess={fetchServico}
                    />
                </div>
            </div>

            {/* Histórico de Horas */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Histórico de Horas</CardTitle>
                    <CardDescription>
                        Todas as sessões de trabalho registradas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {servico.horas.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            Nenhuma hora registrada. Use o cronômetro ou lance horas manualmente.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {servico.horas.map((hora) => {
                                const statusHora = STATUS_HORA_CONFIG[hora.status] ?? STATUS_HORA_CONFIG.FINALIZADA
                                return (
                                    <div
                                        key={hora.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`${statusHora.color}`}>
                                                {statusHora.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {formatDateTime(hora.dataInicio)}
                                                </p>
                                                {hora.dataFim && (
                                                    <p className="text-xs text-muted-foreground">
                                                        até {formatDateTime(hora.dataFim)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className={statusHora.color}>
                                                {statusHora.label}
                                            </Badge>
                                            <span className="text-sm font-medium min-w-[80px] text-right">
                                                {hora.segundos ? formatTempo(hora.segundos) : "Em andamento"}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
