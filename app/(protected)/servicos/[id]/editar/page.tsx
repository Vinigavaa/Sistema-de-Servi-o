"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServicoForm } from "@/components/servicos/servico-form"
import { Skeleton } from "@/components/ui/skeleton"

interface Servico {
    id: string
    nome: string
    descricao: string
    datahora: string
    status: string
    faturado: boolean
}

export default function EditarServicoPage() {
    const params = useParams()
    const router = useRouter()
    const [servico, setServico] = useState<Servico | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchServico() {
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
        }

        if (params.id) {
            fetchServico()
        }
    }, [params.id, router])

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto space-y-6 p-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        )
    }

    if (error || !servico) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="text-center py-10">
                    <p className="text-destructive">{error || "Serviço não encontrado"}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Editar Serviço</h1>
                <p className="text-muted-foreground mt-1">
                    Atualize as informações do serviço.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dados do Serviço</CardTitle>
                    <CardDescription>
                        Altere as informações conforme necessário.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ServicoForm servico={servico} />
                </CardContent>
            </Card>
        </div>
    )
}
