"use client"

import { useEffect, useState, forwardRef, useImperativeHandle } from "react"
import { ServicoCard } from "./servico-card"
import { Skeleton } from "@/components/ui/skeleton"

interface Servico {
    id: string
    nome: string
    descricao: string
    datahora: string
    status: string
    faturado: boolean
    tempoTotal: number
    criado_em: string
}

export interface ServicoListRef {
    refresh: () => void
}

export const ServicoList = forwardRef<ServicoListRef>(function ServicoList(_props, ref) {
    const [servicos, setServicos] = useState<Servico[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function fetchServicos() {
        try {
            setLoading(true)
            const response = await fetch("/api/servico")
            if (!response.ok) throw new Error("Erro ao carregar serviços")
            const data = await response.json()
            setServicos(data)
        } catch (err) {
            setError("Não foi possível carregar os serviços.")
        } finally {
            setLoading(false)
        }
    }

    useImperativeHandle(ref, () => ({
        refresh: fetchServicos,
    }))

    useEffect(() => {
        fetchServicos()
    }, [])

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-destructive">{error}</p>
            </div>
        )
    }

    if (servicos.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">
                    Nenhum serviço cadastrado. Crie seu primeiro serviço!
                </p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servicos.map((servico) => (
                <ServicoCard
                    key={servico.id}
                    servico={servico}
                    onDelete={fetchServicos}
                />
            ))}
        </div>
    )
})
