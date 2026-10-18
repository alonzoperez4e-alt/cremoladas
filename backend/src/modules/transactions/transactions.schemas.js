import { z } from 'zod';

export const getTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha "from" debe tener formato YYYY-MM-DD')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha "to" debe tener formato YYYY-MM-DD')
    .optional(),
  type: z.enum(['income', 'investment', 'withdrawal'], {
    invalid_type_error: 'El tipo debe ser "income", "investment" o "withdrawal"',
  }).optional(),
  account: z.enum(['cash', 'yape', 'own'], {
    invalid_type_error: 'La cuenta debe ser "cash", "yape" o "own"',
  }).optional(),
});
