import fs from 'node:fs';
import path from 'node:path';
import { usesCloudStorage } from './deployment';

// Una lectura corrupta debe fallar: devolver [] permitiría sobrescribir los datos.
export function readLocalRecords<T>(file: string): T[] {
  if (usesCloudStorage()) throw new Error('El almacenamiento local no está disponible en producción. Revise Supabase.');
  if (!fs.existsSync(file)) return [];
  const records: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(records)) throw new Error('El archivo de almacenamiento no contiene una lista válida.');
  return records as T[];
}

export function writeLocalRecords<T>(file: string, records: T[]): void {
  if (usesCloudStorage()) throw new Error('El almacenamiento local no está disponible en producción.');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporaryFile = `${file}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(records, null, 2), 'utf8');
  fs.renameSync(temporaryFile, file);
}
