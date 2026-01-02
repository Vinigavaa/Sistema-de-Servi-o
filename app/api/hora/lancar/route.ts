import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { lancarHorasSchema } from "@/lib/validations/servico";
import { NextResponse, NextRequest } from "next/server";

// Lança horas manualmente (sem cronômetro)
export const POST = withAuth(async (request: NextRequest, userId: string) => {
    try {
        const body = await request.json();
        const validation = lancarHorasSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { servicoId, segundos } = validation.data;

        // Verifica se o serviço pertence ao usuário
        const servico = await prisma.servico.findFirst({
            where: { id: servicoId, userId }
        });

        if (!servico) {
            return NextResponse.json(
                { error: 'Serviço não encontrado.' },
                { status: 404 }
            );
        }

        // Cria hora já finalizada com os segundos informados
        const agora = new Date();
        const dataInicio = new Date(agora.getTime() - (segundos * 1000));

        const hora = await prisma.hora.create({
            data: {
                servicoId,
                dataInicio,
                dataFim: agora,
                segundos,
                status: 'FINALIZADA'
            }
        });

        return NextResponse.json(hora, { status: 201 });
    } catch (error) {
        console.error('Erro ao lançar horas:', error);
        return NextResponse.json(
            { error: 'Erro ao lançar horas.' },
            { status: 500 }
        );
    }
});
