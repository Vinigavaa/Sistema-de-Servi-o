import { HoraForm } from "@/components/confighoras/hora-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfigHorasPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Configuração de Hora</h1>
                <p className="text-muted-foreground mt-1">
                    Defina o valor da sua hora de trabalho.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Valor da Hora</CardTitle>
                    <CardDescription>
                        O valor definido aqui será utilizado para calcular o total a receber em cada serviço.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <HoraForm />
                </CardContent>
            </Card>
        </div>
    );
}