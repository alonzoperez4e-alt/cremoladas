import React from 'react';
import { getPaymentMethod } from '../../lib/paymentMethods';

export function PaymentBadge({ method = 'cash', size = 'sm', showLabel = true, className = '' }) {
  const info = getPaymentMethod(method);
  const Icon = info.icon;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2',
  }[size] || 'text-xs px-2.5 py-1 gap-1.5';

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size] || 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-lg border transition-colors ${info.bgColor} ${info.textColor} ${info.borderColor} ${sizeClasses} ${className}`}
      aria-label={`Método de pago: ${info.label}`}
    >
      <Icon className={`${iconSizes} shrink-0`} style={{ color: info.color }} aria-hidden="true" />
      {showLabel && <span>{info.label}</span>}
    </span>
  );
}
