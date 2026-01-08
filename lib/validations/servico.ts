import { sql } from '@codemirror/lang-sql';
import { z } from 'zod';

export const statusServico = z.enum(['EM_ABERTO', 'FAZENDO', 'TESTANDO', 'CONCLUIDO']);

export const ServicoSchema = z.object({
    nome: z.string()
        .min(3, 'O nome do serviço deve ter no mínimo 3 caracteres')
        .max(100, 'O nome do serviço deve ter no máximo 100 caracteres'),
    descricao: z.string()
        .max(500, 'A descrição do serviço deve ter no máximo 500 caracteres'),
    datahora: z.string().datetime({ message: 'Data/hora inválida' }),
    status: statusServico.default('EM_ABERTO'),
    faturado: z.boolean().default(false),
    sql: z.string().optional(),
});

export const createServicoSchema = ServicoSchema;

// Update permite campos parciais
export const updateServicoSchema = ServicoSchema.partial().extend({
    finalizado_em: z.string().datetime().nullable().optional(),
    sql: z.string().optional(),
});

// Schema para lançar horas manualmente
export const lancarHorasSchema = z.object({
    servicoId: z.string().cuid('ID do serviço inválido'),
    segundos: z.number().int().min(1, 'Tempo deve ser maior que zero'),
    descricao: z.string().max(200).optional(),
});

// Schema para item do CSV do Azure DevOps
export const csvItemSchema = z.object({
    workItemType: z.string().min(1, 'Tipo do item é obrigatório'),
    id: z.string().min(1, 'ID é obrigatório'),
    title: z.string().min(1, 'Título é obrigatório'),
    state: z.string().min(1, 'Estado é obrigatório'),
    liberadoEm: z.string().min(1, 'Data é obrigatória'),
    faturado: z.enum(['Sim', 'Não']),
    time: z.string().regex(/^\d{1,2}:\d{2}$/, 'Formato de hora inválido (esperado HH:mm)'),
});

export const importCsvSchema = z.object({
    items: z.array(csvItemSchema).min(1, 'Nenhum item válido encontrado no CSV'),
});

export type CsvItem = z.infer<typeof csvItemSchema>;
export type ImportCsvInput = z.infer<typeof importCsvSchema>;

export type StatusServico = z.infer<typeof statusServico>;
export type ServicoInput = z.infer<typeof ServicoSchema>;
export type CreateServicoInput = z.infer<typeof createServicoSchema>;
export type UpdateServicoInput = z.infer<typeof updateServicoSchema>;
export type LancarHorasInput = z.infer<typeof lancarHorasSchema>; 