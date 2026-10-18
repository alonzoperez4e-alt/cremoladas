import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { getErrorMessage, setFormErrorsFromApi } from '../lib/errors';
import { toast } from 'sonner';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'La nueva contraseña debe ser diferente a la contraseña actual',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export default function ChangePasswordPage() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success('Contraseña actualizada exitosamente');
      reset();
    } catch (error) {
      const apiCode = error?.response?.data?.error?.code;
      if (apiCode === 'INVALID_PASSWORD' || apiCode === 'INVALID_CREDENTIALS') {
        setError('currentPassword', {
          type: 'server',
          message: 'La contraseña actual ingresada es incorrecta',
        });
      } else if (apiCode === 'SAME_PASSWORD') {
        setError('newPassword', {
          type: 'server',
          message: 'La nueva contraseña debe ser distinta a la actual',
        });
      } else {
        const handled = setFormErrorsFromApi(error, setError);
        if (!handled) {
          setServerError(getErrorMessage(error));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="pb-2 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Cambiar Contraseña
        </h2>
        <p className="text-sm text-slate-500">
          Actualiza la contraseña de tu cuenta para mantener tu sistema seguro.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Seguridad de la cuenta</h3>
            <p className="text-xs text-slate-400">
              Usa una contraseña de al menos 8 caracteres
            </p>
          </div>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <span className="font-medium">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Contraseña Actual */}
          <div className="w-full flex flex-col gap-1.5">
            <label
              htmlFor="currentPassword"
              className="text-xs font-semibold text-slate-700 tracking-wide"
            >
              Contraseña actual
            </label>
            <div className="relative flex items-center">
              <input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña actual"
                className={`w-full min-h-[44px] px-3.5 pr-11 py-2.5 text-sm text-slate-900 bg-white border rounded-xl transition-colors placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-offset-1 ${
                  errors.currentPassword
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-pink-500 focus:ring-pink-100'
                }`}
                {...register('currentPassword')}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                tabIndex={-1}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs font-medium text-rose-600 mt-0.5">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* Nueva Contraseña */}
          <div className="w-full flex flex-col gap-1.5">
            <label
              htmlFor="newPassword"
              className="text-xs font-semibold text-slate-700 tracking-wide"
            >
              Nueva contraseña
            </label>
            <div className="relative flex items-center">
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                className={`w-full min-h-[44px] px-3.5 pr-11 py-2.5 text-sm text-slate-900 bg-white border rounded-xl transition-colors placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-offset-1 ${
                  errors.newPassword
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-pink-500 focus:ring-pink-100'
                }`}
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                tabIndex={-1}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs font-medium text-rose-600 mt-0.5">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="w-full flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-semibold text-slate-700 tracking-wide"
            >
              Confirmar nueva contraseña
            </label>
            <div className="relative flex items-center">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repite la nueva contraseña"
                className={`w-full min-h-[44px] px-3.5 pr-11 py-2.5 text-sm text-slate-900 bg-white border rounded-xl transition-colors placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-offset-1 ${
                  errors.confirmPassword
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-pink-500 focus:ring-pink-100'
                }`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                tabIndex={-1}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs font-medium text-rose-600 mt-0.5">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              icon={ShieldCheck}
              className="w-full"
            >
              Actualizar contraseña
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
