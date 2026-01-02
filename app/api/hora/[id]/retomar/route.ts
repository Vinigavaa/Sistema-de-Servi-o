import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

// Retoma uma sessão pausada (continua de onde parou)
export const POST = withAuth(async (
    _request: NextRequest,
    userId: string,
    { params }: RouteParams
) => {
    try {
        const { id } = await params;

        const horaPausada = await prisma.hora.findFirst({
            where: { id, servico: { userId } }
        });

        if (!horaPausada) {
            return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
        }

        if (horaPausada.status !== 'PAUSADA') {
            return NextResponse.json({ error: 'Apenas sessões pausadas podem ser retomadas.' }, { status: 400 });
        }

        // Reativa a sessão existente - ajusta dataInicio para compensar tempo já acumulado
        const segundosAcumulados = horaPausada.segundos ?? 0;
        const novoInicio = new Date(Date.now() - segundosAcumulados * 1000);

        const hora = await prisma.hora.update({
            where: { id },
            data: {
                status: 'ATIVA',
                dataInicio: novoInicio,
                dataFim: null
            }
        });

        return NextResponse.json(hora);
    } catch (error) {
        console.error('Erro ao retomar sessão:', error);
        return NextResponse.json({ error: 'Erro ao retomar sessão.' }, { status: 500 });
    }
});
