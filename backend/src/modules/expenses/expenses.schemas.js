import { z } from 'zod';
import { isValidDateString } from '../../utils/date.js';

export const expenseBodySchema = z.object({
  materialId: z.coerce
    .number({ required_error: 'El ID del material es obligatorio' })
    .int('El ID del material debe ser un entero')
    .positive('El ID del material debe ser un entero positivo'),
  amount: z.coerce
    .number({ required_error: 'El monto es obligatorio' })
    .positive('El monto debe ser un número positivo')
    .max(99999999.99, 'El monto excede el valor máximo permitido (99999999.99)')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'El monto puede tener un máximo de 2 decimales',
    }),
  expenseDate: z
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
