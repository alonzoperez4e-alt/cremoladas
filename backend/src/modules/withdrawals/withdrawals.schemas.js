import { z } from 'zod';

const decimalRegex = /^\d+(\.\d{1,2})?$/;

const isValidCurrency = (val) => {
  if (typeof val !== 'number' || val < 0) return false;
  return decimalRegex.test(val.toFixed(2)) && Math.abs(val - Math.round(val * 100) / 100) < 0.00001;
};

export const createWithdrawalSchema = z
  .object({
    kind: z.enum(['profit', 'reimbursement'], {
      required_error: 'El tipo de retiro (kind) es obligatorio',
      invalid_type_error: 'El tipo de retiro debe ser "profit" o "reimbursement"',
    }),
    cashAmount: z
      .number({
        required_error: 'El monto en efectivo es obligatorio',
        invalid_type_error: 'El monto en efectivo debe ser un número',
      })
      .min(0, 'El monto en efectivo debe ser mayor o igual a 0')
      .refine(isValidCurrency, { message: 'El monto en efectivo debe tener máximo 2 decimales' }),
    yapeAmount: z
      .number({
        required_error: 'El monto en Yape es obligatorio',
        invalid_type_error: 'El monto en Yape debe ser un número',
      })
      .min(0, 'El monto en Yape debe ser mayor o igual a 0')
      .refine(isValidCurrency, { message: 'El monto en Yape debe tener máximo 2 decimales' }),
    withdrawalDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de retiro debe tener formato YYYY-MM-DD')
      .optional(),
    description: z.string().max(255, 'La descripción no puede exceder 255 caracteres').optional().nullable(),
    confirmCapitalUse: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const sumCents = Math.round(data.cashAmount * 100) + Math.round(data.yapeAmount * 100);
      return sumCents > 0;
    },
    {
      message: 'La suma de efectivo y Yape debe ser mayor a 0',
      path: ['cashAmount'],
    }
  );
