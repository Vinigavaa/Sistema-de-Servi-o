"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Clock, DollarSign, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartBarDefault } from "@/components/chart-bar-default"

interface PeriodoData {
    total: number
    horas: number
    valor: number
}

interface DashboardData {
    valorHora: number
    periodo: { mes: string; offset: number }
    dia: PeriodoData
    semana: PeriodoData
    mes: PeriodoData
    graficos: {
        faturados: { dia: string; quantidade: number }[]
        naoFaturados: { dia: string; quantidade: number }[]
    }
}

const formatHoras = (h: number) => `${Math.floor(h)}h ${Math.round((h % 1) * 60)}min`
const formatValor = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function PeriodoCard({ titulo, data }: { titulo: string; data: PeriodoData }) {
    return (
        <Card>
            <CardHeader className="pb-0">
                <CardTitle className="text-lg">{titulo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                        <p className="text-2xl font-bold">{data.total}</p>
                        <p className="text-xs text-muted-foreground">Serviços concluídos</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                        <p className="text-2xl font-bold">{formatHoras(data.horas)}</p>
                        <p className="text-xs text-muted-foreground">Horas trabalhadas</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                    <div>
                        <p className="text-2xl font-bold">{formatValor(data.valor)}</p>
                        <p className="text-xs text-muted-foreground">Valor faturado</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [offset, setOffset] = useState(0)

    useEffect(() => {
        setLoading(true)
        fetch(`/api/dashboard?offset=${offset}`)
            .then(res => res.ok ? res.json() : null)
            .then(setData)
            .finally(() => setLoading(false))
    }, [offset])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Carregando...</div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-destructive">Erro ao carregar dados</div>
            </div>
        )
    }

    const isCurrentMonth = offset === 0

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Valor/hora: {formatValor(data.valorHora)}
                </p>
            </div>

            {/* Navegação de período */}
            <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setOffset(o => o - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium capitalize min-w-[200px] text-center">
                    {data.periodo.mes}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setOffset(o => o + 1)}
                    disabled={isCurrentMonth}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                {!isCurrentMonth && (
                    <Button variant="ghost" size="sm" onClick={() => setOffset(0)}>
                        Hoje
                    </Button>
                )}
            </div>

            {/* Cards de resumo */}
            <div className="grid gap-4 md:grid-cols-3">
                {isCurrentMonth ? (
                    <>
                        <PeriodoCard titulo="Hoje" data={data.dia} />
                        <PeriodoCard titulo="Esta Semana" data={data.semana} />
                        <PeriodoCard titulo="Este Mês" data={data.mes} />
                    </>
                ) : (
                    <div className="md:col-span-3">
                        <PeriodoCard titulo="Resumo do Mês" data={data.mes} />
                    </div>
                )}
            </div>

            {/* Gráficos de barra */}
            <div className="grid gap-6 md:grid-cols-2">
                <ChartBarDefault
                    title="Serviços Faturados"
                    description="Concluídos e faturados por dia da semana"
                    data={data.graficos.faturados}
                    color="hsl(var(--chart-2))"
                />
                <ChartBarDefault
                    title="Serviços Não Faturados"
                    description="Concluídos e não faturados por dia da semana"
                    data={data.graficos.naoFaturados}
                    color="hsl(var(--chart-3))"
                />
            </div>
        </div>
    )
}
