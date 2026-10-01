
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_COUNT = 5;


export function validateClientFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `El archivo "${file.name}" supera el tamaño máximo permitido de 10 MB.` };
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.includes(extension);
  const hasValidMime = ALLOWED_FILE_TYPES.includes(file.type) || file.type === '';

  if (!hasValidExtension || !hasValidMime) {
    return { valid: false, error: `El archivo "${file.name}" no es de un formato permitido. Solo se aceptan PDF, JPG, PNG, DOC y DOCX.` };
  }

  return { valid: true };
}
