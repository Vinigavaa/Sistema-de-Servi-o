import {z} from 'zod';

export const HoraSchema = z.object({
    
})

export const createHoraSchema = HoraSchema;
export const updateHoraSchema = HoraSchema.partial();
export type HoraInput = z.infer<typeof HoraSchema>;
export type CreateHoraInput = z.infer<typeof createHoraSchema>; 
export type UpdateHoraInput = z.infer<typeof updateHoraSchema>;

