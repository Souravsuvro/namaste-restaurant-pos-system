import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';

export function generateUUID(): string {
  return uuidv4();
}

export function formatCurrency(amount: number): string {
  return `${config.currencySymbol}${amount.toFixed(2)}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateTax(subtotal: number, taxRate?: number): number {
  const rate = taxRate ?? config.taxRate;
  return Math.round(subtotal * rate * 100) / 100;
}

export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getStartOfDay(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

export function getEndOfDay(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  date.setHours(23, 59, 59, 999);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}
