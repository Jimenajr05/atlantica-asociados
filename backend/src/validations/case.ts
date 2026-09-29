import { z } from 'zod';
import { APPOINTMENT_TIME_SLOTS } from '../types';

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

export const caseSubmissionSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, { message: 'Por favor indique su nombre y apellidos completos.' })
    .max(120, { message: 'El nombre es demasiado extenso.' }),
  phone: z
    .string()
    .trim()
    .min(8, { message: 'Indique un número de teléfono o WhatsApp válido de al menos 8 dígitos.' })
    .max(25, { message: 'Número de teléfono demasiado largo.' })
    .regex(/^[0-9+\s\-()]+$/, { message: 'El formato de teléfono no es válido.' }),
  email: z
    .string()
    .trim()
    .email({ message: 'El correo electrónico no tiene un formato válido.' })
    .optional()
    .or(z.literal('')),
  institution: z
    .string()
    .trim()
    .max(150, { message: 'El nombre de la institución es muy extenso.' })
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .trim()
    .min(15, { message: 'Por favor describa brevemente qué ocurrió o qué trámite necesita (mínimo 15 caracteres).' })
    .max(5000, { message: 'La descripción no puede exceder los 5000 caracteres.' }),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: 'Debe aceptar el aviso de privacidad para poder procesar su consulta.',
  }),
  appointmentRequested: z.boolean().default(false),
  preferredDate: z.string().optional().or(z.literal('')),
  preferredTimeSlot: z.enum(APPOINTMENT_TIME_SLOTS).optional().or(z.literal('')),
  websiteUrlHoneypot: z.string().max(0, { message: 'Envío no permitido.' }).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.appointmentRequested) {
    if (!data.preferredDate || data.preferredDate.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['preferredDate'],
        message: 'Seleccione el día preferido para su cita (lunes a viernes).',
      });
    } else {
      const dateObj = new Date(data.preferredDate + 'T12:00:00');
      const day = dateObj.getDay();
      if (day === 0 || day === 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['preferredDate'],
          message: 'El horario de atención es de lunes a viernes (7:00 a.m. a 5:00 p.m.). Por favor elija un día hábil.',
        });
      }
    }

    if (!data.preferredTimeSlot || !APPOINTMENT_TIME_SLOTS.includes(data.preferredTimeSlot as (typeof APPOINTMENT_TIME_SLOTS)[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['preferredTimeSlot'],
        message: 'Seleccione una hora disponible entre las 7:00 a.m. y las 4:00 p.m.',
      });
    }
  }
});

export type CaseSubmissionInput = z.infer<typeof caseSubmissionSchema>;
