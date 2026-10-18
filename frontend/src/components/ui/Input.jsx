import React from 'react';

export const Input = React.forwardRef(function Input(
  {
    label,
    error,
    helperText,
    id,
    type = 'text',
    className = '',
    prefix,
    suffix,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3.5 text-sm font-semibold text-slate-400 select-none pointer-events-none">
            {prefix}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-xl transition-colors placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-offset-1 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
            prefix ? 'pl-9' : ''
          } ${suffix ? 'pr-10' : ''} ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-200 focus:border-pink-500 focus:ring-pink-100'
          } ${className}`}
          {...props}
        />

        {suffix && (
          <div className="absolute right-3 flex items-center text-slate-400">
            {suffix}
          </div>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-medium text-rose-600 mt-0.5">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
});
