"use client"

import { useEffect, useState } from "react"
import { ChartLineInteractive } from "@/components/chart-line-interactive"
import { ChartBarDefault } from "@/components/chart-bar-default"

interface DashboardData {
    periodo: {
        tipo: string
        inicio: string
        fim: string
    }
    resumo: {
        horasTrabalhadas: number
        segundosTotais: number
        servicosAtivos: number
        servicosConcluidos: number
        servicosFaturados: number
        lucroEstimado: number
        valorHora: number
    }
    graficos: {
        horasPorDia: { dia: string; horas: number }[]
        servicosPorData: { date: string; total: number }[]
        faturadosPorDia: { dia: string; quantidade: number }[]
        naoFaturadosPorDia: { dia: string; quantidade: number }[]
    }
}

export default function Dashboard() {
    const [periodo, setPeriodo] = useState<"semana" | "mes">("semana")
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const response = await fetch(`/api/dashboard?periodo=${periodo}`)
                if (response.ok) {
                    const dashboardData = await response.json()
                    setData(dashboardData)
                }
            } catch (error) {
                console.error("Erro ao buscar dados do dashboard:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [periodo])

    const formatPeriodoLabel = () => {
        if (!data) return ""
        const inicio = new Date(data.periodo.inicio)
        const fim = new Date(data.periodo.fim)

        if (periodo === "semana") {
            return `${inicio.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} - ${fim.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`
        }
        return inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Carregando...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            {/* Gráfico de Linha - Serviços por dia */}
            <ChartLineInteractive
                data={data?.graficos.servicosPorData ?? []}
                periodo={periodo}
                onPeriodoChange={setPeriodo}
                periodoLabel={formatPeriodoLabel()}
            />

            {/* Gráficos de Barra - Faturados e Não Faturados */}
            <div className="grid gap-6 md:grid-cols-2">
                <ChartBarDefault
                    title="Serviços Faturados"
                    description="Serviços concluídos e faturados por dia da semana"
                    data={data?.graficos.faturadosPorDia ?? []}
                    color="var(--chart-2)"
                />
                <ChartBarDefault
                    title="Serviços Não Faturados"
                    description="Serviços concluídos e não faturados por dia da semana"
                    data={data?.graficos.naoFaturadosPorDia ?? []}
                    color="var(--chart-3)"
                />
            </div>
        </div>
    )
}
