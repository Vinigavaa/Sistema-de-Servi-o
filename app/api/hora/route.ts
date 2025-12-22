import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { createHoraSchema } from "@/lib/validations/hora";
import { NextResponse, NextRequest } from "next/server";

// Lista todas as horas ativas do usuário (sessões em andamento)
export const GET = withAuth(async (_request: NextRequest, userId: string) => {
    try {
        const horasAtivas = await prisma.hora.findMany({
            where: {
                servico: { userId },
                status: 'ATIVA'
            },
            include: {
                servico: {
                    select: { id: true, nome: true }
                }
            }
        });

        return NextResponse.json(horasAtivas);
    } catch (error) {
        console.error('Erro ao buscar horas ativas:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar horas ativas.' },
            { status: 500 }
        );
    }
});

// Inicia uma nova sessão de trabalho (cronômetro)
export const POST = withAuth(async (request: NextRequest, userId: string) => {
    try {
        const body = await request.json();
        const validation = createHoraSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { servicoId } = validation.data;

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

        // Verifica se já existe uma hora ATIVA para este serviço
        const horaAtiva = await prisma.hora.findFirst({
            where: { servicoId, status: 'ATIVA' }
        });

        if (horaAtiva) {
            return NextResponse.json(
                { error: 'Já existe uma sessão ativa para este serviço.' },
                { status: 409 }
            );
        }

        // Cria nova sessão de trabalho
        const hora = await prisma.hora.create({
            data: {
                servicoId,
                status: 'ATIVA'
            }
        });

        // Atualiza status do serviço para FAZENDO se estiver EM_ABERTO
        if (servico.status === 'EM_ABERTO') {
            await prisma.servico.update({
                where: { id: servicoId },
                data: { status: 'FAZENDO' }
            });
        }

        return NextResponse.json(hora, { status: 201 });
    } catch (error) {
        console.error('Erro ao iniciar sessão:', error);
        return NextResponse.json(
            { error: 'Erro ao iniciar sessão de trabalho.' },
            { status: 500 }
        );
    }
});
