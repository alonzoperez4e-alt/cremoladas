import { z } from 'zod';

const colorRegex = /^#[0-9A-Fa-f]{6}$/;
const iconRegex = /^[a-z0-9-]{1,50}$/;

export const createFlavorSchema = z.object({
  name: z
    .string({ required_error: 'El nombre del sabor es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(60, 'El nombre no puede exceder 60 caracteres'),
  color: z
    .string({ required_error: 'El color es obligatorio' })
    .trim()
    .regex(colorRegex, 'El color debe tener formato hexadecimal #RRGGBB'),
  icon: z
    .string({ required_error: 'El icono es obligatorio' })
    .trim()
    .regex(iconRegex, 'El icono debe contener solo minúsculas, números o guiones (1-50 caracteres)'),
});

export const updateFlavorSchema = createFlavorSchema;

export const updateSoldOutSchema = z.object({
  isSoldOut: z.boolean({ required_error: 'El campo isSoldOut es obligatorio' }),
});
