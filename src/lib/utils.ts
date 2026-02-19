import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(value ?? 0);

export const formatDate = (value: string | Date | null | undefined) => {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(typeof value === 'string' ? new Date(value) : value);
};

export const toTitleCase = (input: string) =>
  input
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
    .join(' ');
