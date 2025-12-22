import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

// Retorna início e fim da semana (domingo a sábado)
function getWeekRange(date: Date): { inicio: Date; fim: Date } {
    const inicio = new Date(date);
    inicio.setDate(date.getDate() - date.getDay());
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    fim.setHours(23, 59, 59, 999);

    return { inicio, fim };
}

// Calcula dados do dashboard semanal
export const GET = withAuth(async (request: NextRequest, userId: string) => {
    try {
        const url = new URL(request.url);
        const semanaOffset = parseInt(url.searchParams.get('semana') ?? '0');

        // Calcula a semana baseado no offset (0 = atual, -1 = anterior, etc.)
        const dataReferencia = new Date();
        dataReferencia.setDate(dataReferencia.getDate() + (semanaOffset * 7));
        const { inicio, fim } = getWeekRange(dataReferencia);

        // Busca config do usuário para valor da hora
        const config = await prisma.config.findUnique({
            where: { userId }
        });
        const valorHora = config?.valorHora ?? 0;

        // Busca serviços do usuário com horas da semana
        const servicos = await prisma.servico.findMany({
            where: { userId },
            include: {
                horas: {
                    where: {
                        dataInicio: { gte: inicio, lte: fim }
                    }
                }
            }
        });

        // Calcula métricas
        let segundosTotais = 0;
        let servicosAtivos = 0;
        let servicosConcluidos = 0;
        let servicosFaturados = 0;

        // Dados por dia da semana
        const porDia: Record<number, number> = {};
        for (let i = 0; i < 7; i++) porDia[i] = 0;

        servicos.forEach(servico => {
            // Contadores de status
            if (servico.status === 'CONCLUIDO') servicosConcluidos++;
            if (servico.status === 'FAZENDO') servicosAtivos++;
            if (servico.faturado) servicosFaturados++;

            // Soma segundos das horas
            servico.horas.forEach(hora => {
                const segundos = hora.segundos ?? 0;
                segundosTotais += segundos;

                // Agrupa por dia da semana
                const diaSemana = hora.dataInicio.getDay();
                porDia[diaSemana] += segundos;
            });
        });

        // Converte segundos para horas (decimal)
        const horasTrabalhadas = segundosTotais / 3600;
        const lucroEstimado = horasTrabalhadas * valorHora;

        // Formata dados por dia
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dadosPorDia = diasSemana.map((nome, index) => ({
            dia: nome,
            horas: porDia[index] / 3600
        }));

        return NextResponse.json({
            semana: {
                inicio: inicio.toISOString(),
                fim: fim.toISOString()
            },
            resumo: {
                horasTrabalhadas: Math.round(horasTrabalhadas * 100) / 100,
                segundosTotais,
                servicosAtivos,
                servicosConcluidos,
                servicosFaturados,
                lucroEstimado: Math.round(lucroEstimado * 100) / 100,
                valorHora
            },
            porDia: dadosPorDia
        });
    } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar dados do dashboard.' },
            { status: 500 }
        );
    }
});
