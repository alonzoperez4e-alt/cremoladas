import React from 'react';

const SIZES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
  xl: 'w-14 h-14 border-4',
};

export function Spinner({ size = 'md', className = '', ...props }) {
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <div
      role="status"
      aria-label="Cargando"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizeClass} ${className}`}
      {...props}
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
