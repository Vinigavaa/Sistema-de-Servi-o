"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Pencil, Trash2, Clock, Timer, Calendar } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    EM_ABERTO: { label: "Em Aberto", variant: "outline" },
    FAZENDO: { label: "Fazendo", variant: "default" },
    TESTANDO: { label: "Testando", variant: "secondary" },
    CONCLUIDO: { label: "Concluído", variant: "secondary" },
}

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

interface ServicoCardProps {
    servico: Servico
    onDelete?: () => void
}

function formatTempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)

    if (horas === 0 && minutos === 0) return "0min"
    if (horas === 0) return `${minutos}min`
    if (minutos === 0) return `${horas}h`
    return `${horas}h ${minutos}min`
}

export function ServicoCard({ servico, onDelete }: ServicoCardProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const statusConfig = STATUS_CONFIG[servico.status] ?? STATUS_CONFIG.EM_ABERTO

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const response = await fetch(`/api/servico/${servico.id}`, {
                method: "DELETE",
            })

            if (response.ok) {
                router.refresh()
                onDelete?.()
            }
        } catch (error) {
            console.error("Erro ao deletar serviço:", error)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{servico.nome}</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
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
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => router.push(`/servicos/${servico.id}`)}
                            title="Ver horas"
                        >
                            <Timer className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => router.push(`/servicos/${servico.id}/editar`)}
                            title="Editar"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir serviço</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tem certeza que deseja excluir o serviço &quot;{servico.nome}&quot;?
                                        Esta ação não pode ser desfeita e todas as horas registradas serão removidas.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        {isDeleting ? "Excluindo..." : "Excluir"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {servico.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {servico.descricao}
                    </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTempo(servico.tempoTotal)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(servico.datahora).toLocaleDateString("pt-BR")}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
