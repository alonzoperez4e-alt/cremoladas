import { z } from 'zod';
import { isValidDateString } from '../../utils/date.js';

export const preparationBodySchema = z.object({
  flavorId: z.coerce
    .number({ required_error: 'El ID del sabor es obligatorio' })
    .int('El ID del sabor debe ser un entero')
    .positive('El ID del sabor debe ser un entero positivo'),
  investmentAmount: z.coerce
    .number({ required_error: 'El monto de inversión es obligatorio' })
    .positive('El monto de inversión debe ser un número positivo')
    .max(99999999.99, 'El monto excede el valor máximo permitido (99999999.99)')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'El monto puede tener un máximo de 2 decimales',
    }),
  prepDate: z
    .string()
    .trim()
    .refine(isValidDateString, 'La fecha debe tener un formato válido YYYY-MM-DD')
    .optional(),
  description: z
    .string()
    .trim()
    .max(255, 'La descripción no puede superar los 255 caracteres')
    .optional()
    .nullable(),
});
