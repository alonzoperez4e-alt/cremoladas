import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { APP_NAME, APP_DESCRIPTION } from '../lib/config';
import { getErrorMessage } from '../lib/errors';

const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Ingresa tu usuario')
    .transform((val) => val.trim()),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Si ya tiene sesión válida, redirigir a inicio
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        {/* Cabecera / Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 to-rose-500 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-pink-200 mb-4 animate-bounce">
            🍧
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            {APP_NAME}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {APP_DESCRIPTION}
          </p>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Iniciar sesión</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {serverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <span className="font-medium">{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo Usuario */}
            <Input
              label="Usuario"
              id="username"
              placeholder="Ej. admin"
              autoComplete="username"
              autoCapitalize="none"
              prefix={<User className="w-4 h-4 text-slate-400" />}
              error={errors.username?.message}
              {...register('username')}
            />

            {/* Campo Contraseña con Toggle Mostrar/Ocultar */}
            <div className="w-full flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-slate-700 tracking-wide"
              >
                Contraseña
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full min-h-[44px] pl-10 pr-11 py-2.5 text-sm text-slate-900 bg-white border rounded-xl transition-colors placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-offset-1 ${
                    errors.password
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-pink-500 focus:ring-pink-100'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-rose-600 mt-0.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="w-full mt-2"
            >
              Entrar al sistema
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} {APP_NAME} — Hecho para Perú 🇵🇪
        </p>
      </div>
    </div>
  );
}
