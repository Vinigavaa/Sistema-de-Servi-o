import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const GET = withAuth(async (request: NextRequest, userId: string) => {
    try {
        const url = new URL(request.url);
        const offset = parseInt(url.searchParams.get('offset') ?? '0');

        const agora = new Date();
        agora.setMonth(agora.getMonth() + offset);

        // Início do dia (considerando offset mensal, pega primeiro dia do mês)
        const inicioDia = new Date(agora);
        if (offset === 0) {
            inicioDia.setHours(0, 0, 0, 0);
        } else {
            inicioDia.setDate(1);
            inicioDia.setHours(0, 0, 0, 0);
        }

        // Início da semana
        const inicioSemana = new Date(agora);
        if (offset === 0) {
            inicioSemana.setDate(agora.getDate() - agora.getDay());
        } else {
            inicioSemana.setDate(1);
        }
        inicioSemana.setHours(0, 0, 0, 0);

        // Início e fim do mês
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);

        // Busca config do usuário
        const config = await prisma.config.findUnique({ where: { userId } });
        const valorHora = config?.valorHora ?? 0;

        // Busca serviços do mês
        const servicosMes = await prisma.servico.findMany({
            where: {
                userId,
                datahora: { gte: inicioMes, lte: fimMes }
            },
            include: { horas: { select: { segundos: true } } }
        });

        // Função para calcular métricas
        const calcular = (servicos: typeof servicosMes) => {
            const concluidos = servicos.filter(s => s.status === 'CONCLUIDO');
            const segundos = concluidos.reduce((acc, s) =>
                acc + s.horas.reduce((h, hora) => h + (hora.segundos ?? 0), 0), 0);
            const horas = segundos / 3600;

            // Calcula valor apenas dos serviços faturados
            const faturados = concluidos.filter(s => s.faturado);
            const segundosFaturados = faturados.reduce((acc, s) =>
                acc + s.horas.reduce((h, hora) => h + (hora.segundos ?? 0), 0), 0);
            const horasFaturadas = segundosFaturados / 3600;

            return {
                total: concluidos.length,
                horas: Math.round(horas * 100) / 100,
                valor: Math.round(horasFaturadas * valorHora * 100) / 100
            };
        };

        // Dados por período
        const servicosConcluidos = servicosMes.filter(s => s.status === 'CONCLUIDO');
        const servicosDia = offset === 0
            ? servicosConcluidos.filter(s => s.datahora >= inicioDia)
            : [];
        const servicosSemana = offset === 0
            ? servicosConcluidos.filter(s => s.datahora >= inicioSemana)
            : [];

        // Gráficos por dia da semana
        const faturadosPorDia = DIAS_SEMANA.map(() => 0);
        const naoFaturadosPorDia = DIAS_SEMANA.map(() => 0);

        servicosConcluidos.forEach(s => {
            const dia = s.datahora.getDay();
            if (s.faturado) faturadosPorDia[dia]++;
            else naoFaturadosPorDia[dia]++;
        });

        return NextResponse.json({
            valorHora,
            periodo: {
                mes: agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                offset
            },
            dia: calcular(servicosDia),
            semana: calcular(servicosSemana),
            mes: calcular(servicosMes),
            graficos: {
                faturados: DIAS_SEMANA.map((dia, i) => ({ dia, quantidade: faturadosPorDia[i] })),
                naoFaturados: DIAS_SEMANA.map((dia, i) => ({ dia, quantidade: naoFaturadosPorDia[i] }))
            }
        });
    } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        return NextResponse.json({ error: 'Erro ao buscar dados.' }, { status: 500 });
    }
});
