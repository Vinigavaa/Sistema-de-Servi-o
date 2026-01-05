import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { importCsvSchema, CsvItem } from "@/lib/validations/servico";
import { NextResponse, NextRequest } from "next/server";
import { StatusServico } from "@/app/generated/prisma/enums";

// Mapeia status do Azure DevOps para status do sistema
function mapStatus(state: string): StatusServico {
    const stateMap: Record<string, StatusServico> = {
        // Concluído
        'Done': 'CONCLUIDO',
        // Em aberto
        'To Do': 'EM_ABERTO',
        'Analized': 'EM_ABERTO',
        // Fazendo
        'Doing': 'FAZENDO',
        'In Progress': 'FAZENDO',
        // Testando
        'Testing': 'TESTANDO',
        'Avaliable for test': 'TESTANDO',
    };
    return stateMap[state] ?? 'EM_ABERTO';
}

// Converte string de data "dd/MM/yyyy HH:mm:ss" para Date
function parseDate(dateStr: string): Date {
    const [datePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    return new Date(year, month - 1, day);
}

// Converte string de horas "HH:mm" para segundos
function parseTimeToSeconds(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 3600) + (minutes * 60);
}

// Parse do CSV para array de objetos
function parseCsv(csvContent: string): CsvItem[] {
    const lines = csvContent.split('\n').filter(line => line.trim());

    // Remove BOM se existir e pega o header
    const header = lines[0].replace(/^\uFEFF/, '');
    const headerCols = header.split(',').map(h => h.trim().replace(/"/g, ''));

    // Índices das colunas
    const colIndexes = {
        workItemType: headerCols.indexOf('Work Item Type'),
        id: headerCols.indexOf('ID'),
        title: headerCols.indexOf('Title'),
        state: headerCols.indexOf('State'),
        liberadoEm: headerCols.indexOf('Liberado em'),
        faturado: headerCols.indexOf('Faturado'),
        time: headerCols.indexOf('time'),
    };

    const items: CsvItem[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse considerando valores entre aspas
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const item: CsvItem = {
            workItemType: values[colIndexes.workItemType] || '',
            id: values[colIndexes.id] || '',
            title: values[colIndexes.title] || '',
            state: values[colIndexes.state] || '',
            liberadoEm: values[colIndexes.liberadoEm] || '',
            faturado: (values[colIndexes.faturado] || 'Não') as 'Sim' | 'Não',
            time: values[colIndexes.time] || '00:00',
        };

        items.push(item);
    }

    return items;
}

export const POST = withAuth(async (request: NextRequest, userId: string) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'Arquivo CSV é obrigatório' },
                { status: 400 }
            );
        }

        const csvContent = await file.text();
        const items = parseCsv(csvContent);

        // Valida os itens
        const validation = importCsvSchema.safeParse({ items });
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        // Busca IDs já existentes para evitar duplicação
        // Usamos o padrão "<ID> - " no início do nome para identificar
        const existingServicos = await prisma.servico.findMany({
            where: { userId },
            select: { nome: true },
        });

        const existingIds = new Set(
            existingServicos
                .map(s => s.nome.match(/^(\d+)\s*-/)?.[1])
                .filter(Boolean)
        );

        const results = {
            created: 0,
            skipped: 0,
            errors: [] as string[],
        };

        for (const item of validation.data.items) {
            // Verifica duplicação pelo ID do Azure
            if (existingIds.has(item.id)) {
                results.skipped++;
                continue;
            }

            try {
                const status = mapStatus(item.state);
                const datahora = parseDate(item.liberadoEm);
                const segundos = parseTimeToSeconds(item.time);

                // Nome: "<ID> - <Título>"
                const nome = `${item.id} - ${item.title}`;

                // Descrição: Tipo do Work Item (para exibir no dashboard)
                const descricao = item.workItemType;

                // Cria o serviço
                const servico = await prisma.servico.create({
                    data: {
                        userId,
                        nome,
                        descricao,
                        status,
                        datahora,
                        faturado: item.faturado === 'Sim',
                        finalizado_em: status === 'CONCLUIDO' ? datahora : null,
                    },
                });

                // Cria registro de horas se houver tempo
                if (segundos > 0) {
                    await prisma.hora.create({
                        data: {
                            servicoId: servico.id,
                            dataInicio: datahora,
                            dataFim: datahora,
                            segundos,
                            status: 'FINALIZADA',
                        },
                    });
                }

                existingIds.add(item.id);
                results.created++;
            } catch (err) {
                results.errors.push(`Erro ao importar item ${item.id}: ${err}`);
            }
        }

        return NextResponse.json({
            message: `Importação concluída: ${results.created} criados, ${results.skipped} ignorados (duplicados)`,
            ...results,
        });
    } catch (error) {
        console.error('Erro ao importar CSV:', error);
        return NextResponse.json(
            { error: 'Erro ao processar arquivo CSV.' },
            { status: 500 }
        );
    }
});
