import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { updateHoraSchema } from "@/lib/validations/hora";
import { NextResponse, NextRequest } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

// Busca uma hora específica
export const GET = withAuth(async (
    _request: NextRequest,
    userId: string,
    { params }: RouteParams
) => {
    try {
        const { id } = await params;

        const hora = await prisma.hora.findFirst({
            where: {
                id,
                servico: { userId }
            },
            include: {
                servico: {
                    select: { id: true, nome: true }
                }
            }
        });

        if (!hora) {
            return NextResponse.json(
                { error: 'Registro de hora não encontrado.' },
                { status: 404 }
            );
        }

        return NextResponse.json(hora);
    } catch (error) {
        console.error('Erro ao buscar hora:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar registro de hora.' },
            { status: 500 }
        );
    }
});

// Atualiza status da hora (pausar/finalizar)
export const PATCH = withAuth(async (
    request: NextRequest,
    userId: string,
    { params }: RouteParams
) => {
    try {
        const { id } = await params;
        const body = await request.json();
        const validation = updateHoraSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        // Busca a hora e verifica propriedade
        const horaExistente = await prisma.hora.findFirst({
            where: {
                id,
                servico: { userId }
            }
        });

        if (!horaExistente) {
            return NextResponse.json(
                { error: 'Registro de hora não encontrado.' },
                { status: 404 }
            );
        }

        // Validações de transição de status
        const { status: novoStatus } = validation.data;

        if (horaExistente.status === 'FINALIZADA') {
            return NextResponse.json(
                { error: 'Não é possível alterar uma sessão já finalizada.' },
                { status: 400 }
            );
        }

        if (horaExistente.status === 'PAUSADA' && novoStatus === 'PAUSADA') {
            return NextResponse.json(
                { error: 'A sessão já está pausada.' },
                { status: 400 }
            );
        }

        // Calcula segundos trabalhados desde o início
        const agora = new Date();
        const segundosNovos = Math.floor(
            (agora.getTime() - horaExistente.dataInicio.getTime()) / 1000
        );

        // Atualiza a hora
        const hora = await prisma.hora.update({
            where: { id },
            data: {
                status: novoStatus,
                dataFim: novoStatus === 'FINALIZADA' ? agora : null,
                segundos: segundosNovos
            }
        });

        return NextResponse.json(hora);
    } catch (error) {
        console.error('Erro ao atualizar hora:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar registro de hora.' },
            { status: 500 }
        );
    }
});

// Deleta um registro de hora
export const DELETE = withAuth(async (
    _request: NextRequest,
    userId: string,
    { params }: RouteParams
) => {
    try {
        const { id } = await params;

        // Verifica se a hora pertence a um serviço do usuário
        const hora = await prisma.hora.findFirst({
            where: {
                id,
                servico: { userId }
            }
        });

        if (!hora) {
            return NextResponse.json(
                { error: 'Registro de hora não encontrado.' },
                { status: 404 }
            );
        }

        await prisma.hora.delete({ where: { id } });

        return NextResponse.json({ message: 'Registro de hora removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar hora:', error);
        return NextResponse.json(
            { error: 'Erro ao deletar registro de hora.' },
            { status: 500 }
        );
    }
});
