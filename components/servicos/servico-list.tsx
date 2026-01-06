"use client"

import { useEffect, useState, forwardRef, useImperativeHandle } from "react"
import { Search } from "lucide-react"
import { ServicoCard } from "./servico-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"

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
    const [busca, setBusca] = useState("")

    // Filtra serviços pelo nome (case-insensitive)
    const servicosFiltrados = servicos.filter(servico =>
        servico.nome.toLowerCase().includes(busca.toLowerCase())
    )

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
        <div className="space-y-4">
            {/* Barra de pesquisa */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar serviço pelo nome..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Lista de serviços filtrados */}
            {servicosFiltrados.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">
                        Nenhum serviço encontrado para "{busca}".
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {servicosFiltrados.map((servico) => (
                        <ServicoCard
                            key={servico.id}
                            servico={servico}
                            onDelete={fetchServicos}
                        />
                    ))}
                </div>
            )}
        </div>
    )
})
