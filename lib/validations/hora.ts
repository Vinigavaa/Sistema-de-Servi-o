import { z } from 'zod';

// Schema para iniciar uma nova sessão de trabalho
export const createHoraSchema = z.object({
    servicoId: z.string().cuid('ID do serviço inválido'),
});

// Schema para atualizar status da hora (pausar/finalizar)
export const updateHoraSchema = z.object({
    status: z.enum(['PAUSADA', 'FINALIZADA'], {
        errorMap: () => ({ message: 'Status deve ser PAUSADA ou FINALIZADA' })
    }),
});

export type CreateHoraInput = z.infer<typeof createHoraSchema>;
export type UpdateHoraInput = z.infer<typeof updateHoraSchema>;

