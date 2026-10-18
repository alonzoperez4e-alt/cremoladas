import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1 && total === 0) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 ${className}`}
    >
      <div className="text-xs text-slate-500 order-2 sm:order-1">
        Mostrando <span className="font-semibold text-slate-700">{total > 0 ? (page - 1) * pageSize + 1 : 0}</span> a{' '}
        <span className="font-semibold text-slate-700">
          {Math.min(page * pageSize, total)}
        </span>{' '}
        de <span className="font-semibold text-slate-700">{total}</span> resultados
      </div>

      <div className="flex items-center gap-2 order-1 sm:order-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
          icon={ChevronLeft}
        >
          Anterior
        </Button>

        <span className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg">
          {page} / {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Página siguiente"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-4 h-4 ml-1 shrink-0" />
        </Button>
      </div>
    </div>
  );
}
