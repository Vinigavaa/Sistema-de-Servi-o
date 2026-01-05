"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/button"
import { ServicoList, ServicoListRef } from "@/components/servicos/servico-list"
import { ImportCsv } from "@/components/servicos/import-csv"

export default function ServicosPage() {
    const servicoListRef = useRef<ServicoListRef>(null)

    const handleImportSuccess = () => {
        servicoListRef.current?.refresh()
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Serviços</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie seus serviços e acompanhe o tempo trabalhado.
                    </p>
                </div>
                <div className="flex gap-2">
                    <ImportCsv onSuccess={handleImportSuccess} />
                    <Button asChild>
                        <Link href="/servicos/novo">
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Serviço
                        </Link>
                    </Button>
                </div>
            </div>

            <ServicoList ref={servicoListRef} />
        </div>
    )
}
