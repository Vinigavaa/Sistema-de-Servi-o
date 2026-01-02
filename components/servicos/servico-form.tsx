"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { ServicoSchema, ServicoInput, updateServicoSchema, UpdateServicoInput } from "@/lib/validations/servico"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const STATUS_OPTIONS = [
    { value: "EM_ABERTO", label: "Em Aberto" },
    { value: "FAZENDO", label: "Fazendo" },
    { value: "TESTANDO", label: "Testando" },
    { value: "CONCLUIDO", label: "Concluído" },
]

interface Servico {
    id: string
    nome: string
    descricao: string
    datahora: string
    status: string
    faturado: boolean
}

interface ServicoFormProps {
    servico?: Servico
    onSuccess?: () => void
}

export function ServicoForm({ servico, onSuccess }: ServicoFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isEditing = !!servico

    const form = useForm<ServicoInput | UpdateServicoInput>({
        resolver: zodResolver(isEditing ? updateServicoSchema : ServicoSchema),
        defaultValues: {
            nome: servico?.nome ?? "",
            descricao: servico?.descricao ?? "",
            datahora: servico?.datahora ?? new Date().toISOString(),
            status: (servico?.status as "EM_ABERTO" | "FAZENDO" | "TESTANDO" | "CONCLUIDO") ?? "EM_ABERTO",
            faturado: servico?.faturado ?? false,
        },
    })

    async function onSubmit(data: ServicoInput | UpdateServicoInput) {
        setIsLoading(true)
        setError(null)

        try {
            const url = isEditing ? `/api/servico/${servico.id}` : "/api/servico"
            const method = isEditing ? "PUT" : "POST"

            const payload = { ...data }
            if (isEditing && data.status === "CONCLUIDO" && servico.status !== "CONCLUIDO") {
                (payload as UpdateServicoInput).finalizado_em = new Date().toISOString()
            }

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Erro ao salvar serviço")
            }

            router.push("/servicos")
            router.refresh()
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao salvar serviço")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Serviço</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ex: Desenvolvimento de API"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Descreva o serviço..."
                                    rows={4}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="datahora"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Data do Serviço</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(new Date(field.value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                            ) : (
                                                <span>Selecione a data</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value ? new Date(field.value) : undefined}
                                        onSelect={(date) => {
                                            if (date) {
                                                field.onChange(date.toISOString())
                                            }
                                        }}
                                        locale={ptBR}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                Data de referência do serviço para os relatórios.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="faturado"
                        render={({ field }) => (
                            <FormItem className="flex flex-col justify-end">
                                <div className="flex items-center gap-3 h-9">
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </FormControl>
                                    <FormLabel className="!mt-0">Serviço faturado</FormLabel>
                                </div>
                                <FormDescription>
                                    Marque se este serviço já foi faturado.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Serviço"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
