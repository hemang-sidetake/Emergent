import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateline(iso: string) {
  try {
    const d = new Date(iso);
    return d
      .toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
      .toUpperCase();
  } catch {
    return iso;
  }
}

export function volumeLabel(n: number) {
  // Demo flourish — "VOL. III · NO. 142" style masthead serial
  const day = new Date().getDate();
  return `VOL. III · NO. ${String(100 + day).padStart(3, '0')}`;
}
