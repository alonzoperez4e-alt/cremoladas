import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({
  title = 'No se pudo cargar la información',
  message = 'Ocurrió un error inesperado al procesar la solicitud.',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-2xl border border-rose-100 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3.5 shadow-xs">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} icon={RotateCcw}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
