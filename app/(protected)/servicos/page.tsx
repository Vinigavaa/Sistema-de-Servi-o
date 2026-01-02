import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ServicoList } from "@/components/servicos/servico-list"

export default function ServicosPage() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Serviços</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie seus serviços e acompanhe o tempo trabalhado.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/servicos/novo">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Serviço
                    </Link>
                </Button>
            </div>

            <ServicoList />
        </div>
    )
}
