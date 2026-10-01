import { AppointmentEvent } from './appointment-email';

// Registrar estas plantillas como UTILITY, idioma es, parámetros posicionales 1–6.
export const whatsappTemplates: Record<AppointmentEvent, { name: string; body: string }> =
  Object.fromEntries(['creada', 'confirmada', 'cancelada', 'reprogramada', 'pendiente'].map(event => [event, {
    name: `atlantica_cita_${event}`,
    body: 'Hola, {{1}}. Su cita en Atlántica & Asociados: fecha {{2}}, hora {{3}} (America/Costa_Rica). Tipo de consulta: {{4}}. Estado: {{5}}. Contacto del despacho: {{6}}. Gracias por su confianza.',
  }])) as Record<AppointmentEvent, { name: string; body: string }>;
