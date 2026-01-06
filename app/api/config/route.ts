import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { updateConfigSchema } from "@/lib/validations/config";
import { NextResponse, NextRequest } from "next/server";

export const GET = withAuth(async (_request: NextRequest, userId: string) => {
    try {
        //config é o nome da tabela no banco de dados
        let config = await prisma.config.findUnique({
            where: { userId }
        });

        if (!config) {
            config = await prisma.config.create({
                data: {
                    userId,
                    valorHora: 0
                }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Erro ao buscar configuração:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar configuração.' },
            { status: 500 }
        );
    }
});

// Atualiza a configuração do usuário
export const PUT = withAuth(async (request: NextRequest, userId: string) => {
    try {
        const body = await request.json();
        const validation = updateConfigSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const config = await prisma.config.upsert({
            where: { userId },
            update: { valorHora: validation.data.valorHora },
            create: {
                userId,
                valorHora: validation.data.valorHora ?? 0
            }
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error('Erro ao atualizar configuração:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar configuração.' },
            { status: 500 }
        );
    }
});
