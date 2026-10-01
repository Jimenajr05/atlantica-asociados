import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const directory = path.resolve(process.cwd(), 'data/case-files');

export function getLocalAttachmentPath(filePath: string): string {
  if (!filePath.startsWith('local/')) throw new Error('El documento no es un adjunto local.');
  const resolved = path.resolve(directory, filePath.slice('local/'.length));
  if (!resolved.startsWith(directory + path.sep)) throw new Error('Ruta de documento inválida.');
  return resolved;
}

export function saveLocalAttachment(caseId: string, file: Express.Multer.File): string {
  const filePath = `local/${caseId}/${randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
  const resolved = getLocalAttachmentPath(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, file.buffer);
  return filePath;
}

export function deleteLocalAttachments(filePaths: string[]): void {
  for (const filePath of filePaths.filter((value) => value.startsWith('local/'))) {
    const resolved = getLocalAttachmentPath(filePath);
    if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
  }
}
