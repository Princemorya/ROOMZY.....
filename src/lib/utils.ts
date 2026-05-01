import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTimestamp(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (val.toMillis) return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  try {
    return new Date(val).getTime();
  } catch {
    return 0;
  }
}

export function formatDate(val: any): string {
  const ts = getTimestamp(val);
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleDateString();
}
