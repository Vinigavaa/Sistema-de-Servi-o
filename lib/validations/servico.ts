import { z } from 'zod';

const statusServico = z.enum(['EM_ABERTO', 'FAZENDO', 'TESTANDO', 'CONCLUIDO']);

export const ServicoSchema = z.object({
    nome: z.string()
        .min(3, 'O nome do serviço deve ter no mínimo 3 caracteres')
        .max(100, 'O nome do serviço deve ter no máximo 100 caracteres'),
    descricao: z.string()
        .max(500, 'A descrição do serviço deve ter no máximo 500 caracteres'),
});

export const createServicoSchema = ServicoSchema;

// Update permite alterar status e faturado além dos campos base
export const updateServicoSchema = ServicoSchema.partial().extend({
    status: statusServico.optional(),
    faturado: z.boolean().optional(),
    finalizado_em: z.string().datetime().nullable().optional(),
});

export type ServicoInput = z.infer<typeof ServicoSchema>;
export type CreateServicoInput = z.infer<typeof createServicoSchema>;
export type UpdateServicoInput = z.infer<typeof updateServicoSchema>; 