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

/**
 * Returns a due-date countdown object for display.
 * Only shown on unpaid invoices (pass `isPaid=true` to suppress).
 */
export function dueDateStatus(dueDateStr: string | null | undefined, isPaid: boolean): {
  label: string;
  color: 'emerald' | 'amber' | 'red' | 'slate';
} | null {
  if (isPaid || !dueDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days > 14) return { label: `Due in ${days}d`, color: 'emerald' };
  if (days > 7)  return { label: `Due in ${days}d`, color: 'slate' };
  if (days > 1)  return { label: `Due in ${days}d`, color: 'amber' };
  if (days === 1) return { label: 'Due tomorrow', color: 'amber' };
  if (days === 0) return { label: 'Due today', color: 'red' };
  return { label: `Overdue ${Math.abs(days)}d`, color: 'red' };
}

export const toTitleCase = (input: string) =>
  input
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
    .join(' ');
