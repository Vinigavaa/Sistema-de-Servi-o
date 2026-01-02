import { z } from 'zod';

// Enum alinhado com o StatusHora do Prisma
export const statusHora = z.enum(['ATIVA', 'PAUSADA', 'FINALIZADA']);

// Schema base para Hora
export const HoraSchema = z.object({
    servicoId: z.string().cuid('ID do serviço inválido'),
    dataInicio: z.string().datetime().optional(),
    dataFim: z.string().datetime().nullable().optional(),
    segundos: z.number().int().min(0).nullable().optional(),
    status: statusHora.optional(),
});

// Schema para criar nova hora (apenas servicoId é obrigatório)
export const createHoraSchema = z.object({
    servicoId: z.string().cuid('ID do serviço inválido'),
});

// Schema para atualizar hora (pausar/retomar/finalizar)
export const updateHoraSchema = z.object({
    status: statusHora,
    dataFim: z.string().datetime().nullable().optional(),
    segundos: z.number().int().min(0).nullable().optional(),
});

export type StatusHora = z.infer<typeof statusHora>;
export type HoraInput = z.infer<typeof HoraSchema>;
export type CreateHoraInput = z.infer<typeof createHoraSchema>;
export type UpdateHoraInput = z.infer<typeof updateHoraSchema>;

