export type AppointmentEvent = 'creada' | 'confirmada' | 'cancelada' | 'reprogramada' | 'pendiente';
export const eventLabels: Record<AppointmentEvent, string> = {
  creada: 'recibida, pendiente de confirmación', confirmada: 'confirmada',
  cancelada: 'cancelada', reprogramada: 'reprogramada', pendiente: 'pendiente de confirmación',
};
export function appointmentEmail(values: string[], office = false) {
  const [name, date, time, type, status, contact] = values;
  return {
    subject: `${office ? 'Nueva solicitud de cita' : 'Su cita'} — ${status}`,
    text: `${office ? 'Se ha recibido una nueva solicitud.' : `Hola, ${name}. Le informamos sobre su cita.`}\n\nNombre: ${name}\nFecha: ${date}\nHora: ${time} (America/Costa_Rica)\nTipo de consulta: ${type}\nEstado: ${status}\n\nContacto del despacho: ${contact}\nGracias por confiar en Atlántica & Asociados.`,
  };
}
