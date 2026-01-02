import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServicoForm } from "@/components/servicos/servico-form"

export default function NovoServicoPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Novo Serviço</h1>
                <p className="text-muted-foreground mt-1">
                    Cadastre um novo serviço para começar a registrar horas.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dados do Serviço</CardTitle>
                    <CardDescription>
                        Preencha as informações do serviço que você irá realizar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ServicoForm />
                </CardContent>
            </Card>
        </div>
    )
}
