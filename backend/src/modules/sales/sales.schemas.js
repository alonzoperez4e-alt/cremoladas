import { z } from 'zod';

const saleItemSchema = z.object({
  flavorIds: z
    .array(
      z.coerce.number().int().positive('Cada ID de sabor debe ser un entero positivo')
    )
    .min(1, 'Cada vaso debe tener al menos 1 sabor')
    .max(6, 'Cada vaso no puede exceder 6 sabores')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'No se permiten sabores duplicados en el mismo vaso',
    }),
  quantity: z.coerce
    .number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima por vaso es 1')
    .max(50, 'La cantidad máxima por línea de vasos es 50'),
});

export const createSaleSchema = z.object({
  items: z
    .array(saleItemSchema)
    .min(1, 'La venta debe contener al menos 1 línea de vasos')
    .max(50, 'La venta no puede superar 50 líneas de vasos'),
});
