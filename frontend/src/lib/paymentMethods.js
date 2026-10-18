import { Banknote, Smartphone } from 'lucide-react';

export const PAYMENT_METHODS = {
  cash: {
    id: 'cash',
    label: 'Efectivo',
    icon: Banknote,
    color: '#16a34a',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    accentColor: '#16a34a',
  },
  yape: {
    id: 'yape',
    label: 'Yape',
    icon: Smartphone,
    color: '#742284',
    bgColor: 'bg-purple-50',
    textColor: 'text-[#742284]',
    borderColor: 'border-[#d8b4e2]',
    accentColor: '#742284',
  },
};

export const getPaymentMethod = (id) => {
  return PAYMENT_METHODS[id] || PAYMENT_METHODS.cash;
};
