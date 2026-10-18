import { z } from 'zod';

export const materialSchema = z.object({
  name: z
    .string({ required_error: 'El nombre del material es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede exceder 80 caracteres'),
});
