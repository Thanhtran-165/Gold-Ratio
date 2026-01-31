import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type TimeWindow = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | '10Y' | 'ALL' | 'MAX';

export function getWindowStartDate(window: TimeWindow): Date {
  const now = new Date();
  const result = new Date(now);

  switch (window) {
    case '1M':
      result.setMonth(now.getMonth() - 1);
      break;
    case '3M':
      result.setMonth(now.getMonth() - 3);
      break;
    case '6M':
      result.setMonth(now.getMonth() - 6);
      break;
    case '1Y':
      result.setFullYear(now.getFullYear() - 1);
      break;
    case '3Y':
      result.setFullYear(now.getFullYear() - 3);
      break;
    case '5Y':
      result.setFullYear(now.getFullYear() - 5);
      break;
    case '10Y':
      result.setFullYear(now.getFullYear() - 10);
      break;
    case 'ALL':
    case 'MAX':
      result.setFullYear(now.getFullYear() - 100);
      break;
  }

  return result;
}

export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value) || !isFinite(value)) return 'N/A';
  return value.toFixed(decimals);
}

export function formatPercent(value: number, decimals: number = 2): string {
  if (isNaN(value) || !isFinite(value)) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return sign + value.toFixed(decimals) + '%';
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatPrice(value: number, decimals: number = 2): string {
  return formatNumber(value, decimals);
}
