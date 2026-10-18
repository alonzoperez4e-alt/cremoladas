import { TIMEZONE } from './config';

/**
 * Returns today's date in Lima timezone as 'YYYY-MM-DD'.
 * Uses Intl.DateTimeFormat to avoid server clock issues.
 */
export function getTodayLima() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}
