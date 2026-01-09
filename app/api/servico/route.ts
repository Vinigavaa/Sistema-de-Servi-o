import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { createServicoSchema } from "@/lib/validations/servico";
import { NextResponse, NextRequest } from "next/server";

export const GET = withAuth(async (_request: NextRequest, userId: string) => {
    try {
        const servicos = await prisma.servico.findMany({
            where: { userId },
            include: {
                horas: {
                    select: { segundos: true, status: true }
                }
            },
            orderBy: { datahora: 'desc' }
        });

        const servicosComTempo = servicos.map(servico => {
            const tempoTotal = servico.horas.reduce((acc, hora) => {
                return acc + (hora.segundos ?? 0);
            }, 0);

            const { horas, ...resto } = servico;
            return { ...resto, tempoTotal };
        });

        return NextResponse.json(servicosComTempo);
    } catch (error) {
        console.error('Erro ao buscar serviços:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar serviços.' },
            { status: 500 }
        );
    }
});

export const POST = withAuth(async (request: NextRequest, userId: string) => {
    try {
        const body = await request.json();
        const validation = createServicoSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        // Se status for CONCLUIDO, define finalizado_em
        const finalizado_em = validation.data.status === 'CONCLUIDO'
            ? new Date()
            : null;

        const servico = await prisma.servico.create({
            data: {
                userId,
                nome: validation.data.nome,
                descricao: validation.data.descricao,
                datahora: new Date(validation.data.datahora),
                status: validation.data.status,
                faturado: validation.data.faturado,
                finalizado_em,
            }
        });

        return NextResponse.json(servico, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar serviço:', error);
        return NextResponse.json(
            { error: 'Erro ao criar serviço.' },
            { status: 500 }
        );
    }
});
