import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string({
      required_error: 'El nombre de usuario es obligatorio',
      invalid_type_error: 'El nombre de usuario debe ser una cadena de texto',
    })
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder los 50 caracteres')
    .refine((val) => !/\s/.test(val), {
      message: 'El nombre de usuario no debe contener espacios',
    }),
  password: z
    .string({
      required_error: 'La contraseña es obligatoria',
      invalid_type_error: 'La contraseña debe ser una cadena de texto',
    })
    .min(1, 'La contraseña no puede estar vacía')
    .max(128, 'La contraseña no puede exceder los 128 caracteres'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({
        required_error: 'La contraseña actual es obligatoria',
      })
      .min(1, 'La contraseña actual no puede estar vacía'),
    newPassword: z
      .string({
        required_error: 'La nueva contraseña es obligatoria',
      })
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .max(128, 'La nueva contraseña no puede exceder los 128 caracteres'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser distinta a la actual',
    path: ['newPassword'],
  });
