import {z} from 'zod';

export const ServicoSchema = z.object({
    nome: z.string().min(3, 'O nome do serviço deve ter no mínimo 3 caracteres')
    .max(100, 'O nome do serviço deve ter no máximo 100 caracteres'),
    descricao: z.string().max(50, 'A descrição do serviço deve ter no máximo 50 caracteres'),
});

export const createServicoSchema = ServicoSchema;
export const updateServicoSchema = ServicoSchema.partial();

export type ServicoInput = z.infer<typeof ServicoSchema>;
export type CreateServicoInput = z.infer<typeof createServicoSchema>;
export type UpdateServicoInput = z.infer<typeof updateServicoSchema>; 