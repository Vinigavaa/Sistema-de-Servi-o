"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { ConfigSchema, ConfigInput } from "@/lib/validations/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"

interface HoraFormProps {
    onSuccess?: () => void
}

export function HoraForm({ onSuccess }: HoraFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const form = useForm<ConfigInput>({
        resolver: zodResolver(ConfigSchema),
        defaultValues: {
            valorHora: 0,
        },
    })

    useEffect(() => {
        async function fetchConfig() {
            try {
                const response = await fetch("/api/config")
                if (!response.ok) throw new Error("Erro ao carregar configuração")
                const data = await response.json()
                form.reset({ valorHora: data.valorHora })
            } catch (err) {
                setError("Não foi possível carregar a configuração.")
            } finally {
                setIsFetching(false)
            }
        }

        fetchConfig()
    }, [form])

    async function onSubmit(data: ConfigInput) {
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const response = await fetch("/api/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Erro ao salvar configuração")
            }

            setSuccess(true)
            router.refresh()
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao salvar configuração")
        } finally {
            setIsLoading(false)
        }
    }

    const valorAtual = form.watch("valorHora")

    //<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6"> 
    //executa ao enviar o form valida os dados com handle-submit se der tudo certo ai sim chama o onSubmit
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="valorHora"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor da Hora (R$)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        R$
                                    </span>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={1}
                                        placeholder="0"
                                        className="pl-10"
                                        disabled={isFetching}
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </div>
                            </FormControl>
                            <FormDescription>
                                Este valor será usado para calcular o total a receber pelos serviços.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                {success && (
                    <p className="text-sm text-green-600">Configuração salva com sucesso!</p>
                )}

                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Valor atual: <span className="font-medium text-foreground">R$ {valorAtual}</span>
                    </p>
                    <Button type="submit" disabled={isLoading || isFetching}>
                        {isLoading ? "Salvando..." : "Salvar"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
