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
});

export const createServicoSchema = ServicoSchema;

// Update permite campos parciais
export const updateServicoSchema = ServicoSchema.partial().extend({
    finalizado_em: z.string().datetime().nullable().optional(),
});

// Schema para lançar horas manualmente
export const lancarHorasSchema = z.object({
    servicoId: z.string().cuid('ID do serviço inválido'),
    segundos: z.number().int().min(1, 'Tempo deve ser maior que zero'),
    descricao: z.string().max(200).optional(),
});

export type StatusServico = z.infer<typeof statusServico>;
export type ServicoInput = z.infer<typeof ServicoSchema>;
export type CreateServicoInput = z.infer<typeof createServicoSchema>;
export type UpdateServicoInput = z.infer<typeof updateServicoSchema>;
export type LancarHorasInput = z.infer<typeof lancarHorasSchema>; 