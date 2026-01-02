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

// Retorna início e fim do mês
function getMonthRange(date: Date): { inicio: Date; fim: Date } {
    const inicio = new Date(date.getFullYear(), date.getMonth(), 1);
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    fim.setHours(23, 59, 59, 999);

    return { inicio, fim };
}

// Calcula dados do dashboard semanal/mensal
export const GET = withAuth(async (request: NextRequest, userId: string) => {
    try {
        const url = new URL(request.url);
        const periodo = url.searchParams.get('periodo') ?? 'semana'; // 'semana' ou 'mes'
        const offset = parseInt(url.searchParams.get('offset') ?? '0');

        // Calcula o período baseado no offset
        const dataReferencia = new Date();
        let inicio: Date, fim: Date;

        if (periodo === 'mes') {
            dataReferencia.setMonth(dataReferencia.getMonth() + offset);
            const range = getMonthRange(dataReferencia);
            inicio = range.inicio;
            fim = range.fim;
        } else {
            dataReferencia.setDate(dataReferencia.getDate() + (offset * 7));
            const range = getWeekRange(dataReferencia);
            inicio = range.inicio;
            fim = range.fim;
        }

        // Busca config do usuário para valor da hora
        const config = await prisma.config.findUnique({
            where: { userId }
        });
        const valorHora = config?.valorHora ?? 0;

        // Busca serviços do usuário no período (usando datahora)
        const servicos = await prisma.servico.findMany({
            where: {
                userId,
                datahora: { gte: inicio, lte: fim }
            },
            include: {
                horas: true
            }
        });

        // Busca serviços faturados e não faturados no período
        const servicosFaturadosNoPeriodo = servicos.filter(s => s.faturado);
        const servicosNaoFaturadosNoPeriodo = servicos.filter(s => !s.faturado);

        // Calcula métricas
        let segundosTotais = 0;
        let servicosAtivos = 0;
        let servicosConcluidos = 0;
        let servicosFaturados = 0;

        // Dados por dia da semana (para horas trabalhadas)
        const horasPorDia: Record<number, number> = {};
        for (let i = 0; i < 7; i++) horasPorDia[i] = 0;

        // Dados de serviços por dia (usando datahora)
        const servicosFaturadosPorDia: Record<number, number> = {};
        const servicosNaoFaturadosPorDia: Record<number, number> = {};
        for (let i = 0; i < 7; i++) {
            servicosFaturadosPorDia[i] = 0;
            servicosNaoFaturadosPorDia[i] = 0;
        }

        // Dados de serviços por data (para gráfico de linha)
        const servicosPorData: Record<string, number> = {};

        servicos.forEach(servico => {
            // Contadores de status
            if (servico.status === 'CONCLUIDO') servicosConcluidos++;
            if (servico.status === 'FAZENDO') servicosAtivos++;
            if (servico.faturado) servicosFaturados++;

            // Soma segundos das horas
            servico.horas.forEach(hora => {
                const segundos = hora.segundos ?? 0;
                segundosTotais += segundos;

                // Agrupa por dia da semana baseado na datahora do serviço
                const diaSemana = servico.datahora.getDay();
                horasPorDia[diaSemana] += segundos;
            });

            // Agrupa serviços por dia da semana (usando datahora)
            const diaSemana = servico.datahora.getDay();
            const dataStr = servico.datahora.toISOString().split('T')[0];

            if (servico.faturado) {
                servicosFaturadosPorDia[diaSemana]++;
            } else {
                servicosNaoFaturadosPorDia[diaSemana]++;
            }

            // Agrupa por data (para gráfico de linha)
            servicosPorData[dataStr] = (servicosPorData[dataStr] ?? 0) + 1;
        });

        // Converte segundos para horas (decimal)
        const horasTrabalhadas = segundosTotais / 3600;
        const lucroEstimado = horasTrabalhadas * valorHora;

        // Formata dados por dia da semana
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dadosHorasPorDia = diasSemana.map((nome, index) => ({
            dia: nome,
            horas: Math.round((horasPorDia[index] / 3600) * 100) / 100
        }));

        const dadosFaturadosPorDia = diasSemana.map((nome, index) => ({
            dia: nome,
            quantidade: servicosFaturadosPorDia[index]
        }));

        const dadosNaoFaturadosPorDia = diasSemana.map((nome, index) => ({
            dia: nome,
            quantidade: servicosNaoFaturadosPorDia[index]
        }));

        // Formata dados por data para gráfico de linha
        const dadosServicosPorData = Object.entries(servicosPorData)
            .map(([date, total]) => ({ date, total }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            periodo: {
                tipo: periodo,
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
            graficos: {
                horasPorDia: dadosHorasPorDia,
                servicosPorData: dadosServicosPorData,
                faturadosPorDia: dadosFaturadosPorDia,
                naoFaturadosPorDia: dadosNaoFaturadosPorDia
            }
        });
    } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar dados do dashboard.' },
            { status: 500 }
        );
    }
});
