import { z } from 'zod';

export function normalizeEmail(value?: string | null): string {
  return z.string().email().parse((value || '').trim().toLowerCase());
}

export function normalizeWhatsApp(value: string): string {
  if (!/^[+\d\s()-]+$/.test(value.trim())) throw new Error('WhatsApp inválido.');
  let number = value.replace(/[\s()-]/g, '');
  if (number.startsWith('00')) number = '+' + number.slice(2);
  if (/^\d{8}$/.test(number)) number = '+506' + number;
  else if (/^506\d{8}$/.test(number)) number = '+' + number;
  if (!/^\+[1-9]\d{7,14}$/.test(number) || (number.startsWith('+506') && !/^\+506[2-8]\d{7}$/.test(number))) {
    throw new Error('Indique un WhatsApp internacional válido; para Costa Rica puede ingresar 8 dígitos.');
  }
  return number;
}
