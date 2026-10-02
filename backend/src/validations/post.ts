import { z } from 'zod';

export const postSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio.').max(250),
  slug: z.string().trim().toLowerCase().min(1).max(250).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug debe contener letras, números y guiones.').refine(value => value !== 'article', 'Seleccione otro slug: article está reservado.'),
  excerpt: z.string().trim().max(5000).optional(),
  content: z.string().trim().min(1, 'El contenido es obligatorio.').max(1_000_000),
  published: z.boolean().optional(),
  category: z.enum(['blog', 'noticias']).optional(),
});

export const postUpdateSchema = postSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Indique al menos un campo para actualizar.',
);
