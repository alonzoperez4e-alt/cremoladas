import { CURRENCY_LOCALE, CURRENCY_CODE, TIMEZONE } from './config';

/**
 * Formats a number as Peruvian Soles (e.g. S/ 12.50 or -S/ 12.50 for negatives).
 * Explicitly ensures minus sign for negative amounts without ambiguity.
 */
export function formatCurrency(n) {
  if (n == null || isNaN(n)) return 'S/ 0.00';
  const val = Number(n);
  const formatted = new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(val));

  if (val < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

/**
 * Formats 'YYYY-MM-DD' to 'DD/MM/YYYY' without timezone desfase.
 * Parses the string directly instead of using new Date('YYYY-MM-DD').
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).slice(0, 10).split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

/**
 * Formats an ISO date/timestamp to 12-hour time in America/Lima timezone (e.g. '3:45 p. m.')
 */
export function formatTime(isoDateStr) {
  if (!isoDateStr) return '';
  const date = new Date(isoDateStr);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(CURRENCY_LOCALE, {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
