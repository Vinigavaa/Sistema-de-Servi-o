import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

// Retoma uma sessão pausada criando uma nova hora
export const POST = withAuth(async (
    _request: NextRequest,
    userId: string,
    { params }: RouteParams
) => {
    try {
        const { id } = await params;

        // Busca a hora pausada
        const horaPausada = await prisma.hora.findFirst({
            where: {
                id,
                servico: { userId }
            },
            include: { servico: true }
        });

        if (!horaPausada) {
            return NextResponse.json(
                { error: 'Registro de hora não encontrado.' },
                { status: 404 }
            );
        }

        if (horaPausada.status !== 'PAUSADA') {
            return NextResponse.json(
                { error: 'Apenas sessões pausadas podem ser retomadas.' },
                { status: 400 }
            );
        }

        // Verifica se já existe uma hora ativa para este serviço
        const horaAtiva = await prisma.hora.findFirst({
            where: {
                servicoId: horaPausada.servicoId,
                status: 'ATIVA'
            }
        });

        if (horaAtiva) {
            return NextResponse.json(
                { error: 'Já existe uma sessão ativa para este serviço.' },
                { status: 409 }
            );
        }

        // Cria nova sessão de trabalho
        const novaHora = await prisma.hora.create({
            data: {
                servicoId: horaPausada.servicoId,
                status: 'ATIVA'
            }
        });

        return NextResponse.json(novaHora, { status: 201 });
    } catch (error) {
        console.error('Erro ao retomar sessão:', error);
        return NextResponse.json(
            { error: 'Erro ao retomar sessão de trabalho.' },
            { status: 500 }
        );
    }
});
