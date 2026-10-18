import React from 'react';
import { Spinner } from './Spinner';

const VARIANTS = {
  primary:
    'bg-pink-600 hover:bg-pink-700 text-white shadow-sm shadow-pink-200 active:bg-pink-800 focus-visible:ring-pink-500',
  secondary:
    'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 active:bg-slate-100 focus-visible:ring-slate-400 shadow-xs',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200 active:bg-rose-800 focus-visible:ring-rose-500',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-700 active:bg-slate-200 focus-visible:ring-slate-400',
};

const SIZES = {
  sm: 'min-h-[38px] px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'min-h-[44px] px-4 py-2.5 text-sm font-semibold rounded-xl gap-2',
  lg: 'min-h-[48px] px-5 py-3 text-base font-semibold rounded-xl gap-2.5',
};

export const Button = React.forwardRef(function Button(
  {
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    icon: Icon,
    ...props
  },
  ref
) {
  const variantStyles = VARIANTS[variant] || VARIANTS.primary;
  const sizeStyles = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center transition-all select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 ${variantStyles} ${sizeStyles} ${
        isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer active:scale-[0.98]'
      } ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="shrink-0 text-current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
});
