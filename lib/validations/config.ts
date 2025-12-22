import {z} from 'zod';

export const ConfigSchema = z.object({
    valorHora: z.number().min(0, 'O valor da hora deve ser um numero positivo') 
    .max(1000000, 'O valor da hora deve ser um numero menor que 1.000.000'),
});

export const createConfigSchema = ConfigSchema;

export const updateConfigSchema = ConfigSchema.partial();

export type ConfigInput = z.infer<typeof ConfigSchema>;
export type CreateConfigInput = z.infer<typeof createConfigSchema>;
export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;
