import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { updateServicoSchema } from "@/lib/validations/servico";
import { NextResponse, NextRequest } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

// Busca um serviço específico com suas horas
export const GET = withAuth(async (
    _request: NextRequest,
    userId: string,
    { params }: RouteParams
) => {
    try {
        const { id } = await params;

        const servico = await prisma.servico.findFirst({
            where: { id, userId },
            include: {
                horas: {
                    orderBy: { dataInicio: 'desc' }
                }
            }
        });

        if (!servico) {
            return NextResponse.json(
                { error: 'Serviço não encontrado.' },
                { status: 404 }
            );
        }

        // Calcula tempo total
        const tempoTotal = servico.horas.reduce((acc, hora) => {
            return acc + (hora.segundos ?? 0);
        }, 0);

        return NextResponse.json({ ...servico, tempoTotal });
    } catch (error) {
        console.error('Erro ao buscar serviço:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar serviço.' },
            { status: 500 }
        );
    }
});

// Atualiza um serviço (nome, descrição, status, faturado)
export const PUT = withAuth(async (
    request: NextRequest,
    userId: string,
    { params }: RouteParams
) => {
    try {
        const { id } = await params;
        const body = await request.json();
        const validation = updateServicoSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        // Verifica se o serviço pertence ao usuário
        const existente = await prisma.servico.findFirst({
            where: { id, userId }
        });

        if (!existente) {
            return NextResponse.json(
                { error: 'Serviço não encontrado.' },
                { status: 404 }
            );
        }

        // Converte datahora string para Date se presente
        const updateData = {
            ...validation.data,
            ...(validation.data.datahora && { datahora: new Date(validation.data.datahora) }),
            ...(validation.data.finalizado_em && { finalizado_em: new Date(validation.data.finalizado_em) }),
        };

        const servico = await prisma.servico.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(servico);
    } catch (error) {
        console.error('Erro ao atualizar serviço:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar serviço.' },
            { status: 500 }
        );
    }
});

// Deleta um serviço e suas horas associadas
export const DELETE = withAuth(async (
    _request: NextRequest,
    userId: string,
    { params }: RouteParams
) => {
    try {
        const { id } = await params;

        // Verifica se o serviço pertence ao usuário
        const existente = await prisma.servico.findFirst({
            where: { id, userId }
        });

        if (!existente) {
            return NextResponse.json(
                { error: 'Serviço não encontrado.' },
                { status: 404 }
            );
        }

        // Cascade delete está configurado no schema
        await prisma.servico.delete({ where: { id } });

        return NextResponse.json({ message: 'Serviço removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar serviço:', error);
        return NextResponse.json(
            { error: 'Erro ao deletar serviço.' },
            { status: 500 }
        );
    }
});