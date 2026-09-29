import fs from 'fs';
import path from 'path';
import { createAdminClient } from './supabase-admin';
import { getAppointmentBookings } from './cases-store';
import {
  APPOINTMENT_TIME_SLOTS,
  AppointmentDayAvailability,
  TimeSlot,
} from '../types';

interface AvailabilityOverride {
  date: string;
  time_slot: TimeSlot;
  is_available: boolean;
  updated_at?: string;
}

const timeSlots: readonly TimeSlot[] = APPOINTMENT_TIME_SLOTS;
const legacyTimeSlots: Record<string, readonly TimeSlot[]> = {
  manana: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00'],
  tarde: ['13:00', '14:00', '15:00', '16:00'],
};
const dataDir = path.resolve(process.cwd(), 'data');
const availabilityFilePath = path.join(dataDir, 'appointment-availability.json');

function getLocalOverrides(): AvailabilityOverride[] {
  try {
    if (!fs.existsSync(availabilityFilePath)) return [];
    const parsed = JSON.parse(fs.readFileSync(availabilityFilePath, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error leyendo disponibilidad local de citas:', error);
    return [];
  }
}

function saveLocalOverrides(overrides: AvailabilityOverride[]) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(availabilityFilePath, JSON.stringify(overrides, null, 2), 'utf-8');
}

export function isValidAppointmentDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function getCostaRicaDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

async function getOverrides(from: string, to: string): Promise<AvailabilityOverride[]> {
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    const { data, error } = await adminSupabase
      .from('appointment_availability')
      .select('date, time_slot, is_available')
      .gte('date', from)
      .lte('date', to);

    if (error) throw error;
    return (data || []) as AvailabilityOverride[];
  }

  return getLocalOverrides()
    .filter((item) => item.date >= from && item.date <= to)
    .flatMap((item) => {
      const legacySlots = legacyTimeSlots[item.time_slot];
      if (legacySlots) {
        return legacySlots.map((timeSlot) => ({ ...item, time_slot: timeSlot }));
      }
      return timeSlots.includes(item.time_slot) ? [item] : [];
    });
}

export async function getAppointmentAvailability(
  from: string,
  days: number,
  options: { excludeBookingId?: string; ignoreLegacyReservations?: boolean } = {}
): Promise<AppointmentDayAvailability[]> {
  if (!isValidAppointmentDate(from) || !Number.isInteger(days) || days < 1 || days > 62) {
    throw new Error('El rango de fechas solicitado no es válido.');
  }

  const to = addDays(from, days - 1);
  const [overrides, bookings] = await Promise.all([
    getOverrides(from, to),
    getAppointmentBookings(),
  ]);
  const overrideMap = new Map(overrides.map((item) => [`${item.date}:${item.time_slot}`, item.is_available]));
  const tomorrow = addDays(getCostaRicaDate(), 1);
  const availability: AppointmentDayAvailability[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(from, offset);
    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;

    const slots = {} as AppointmentDayAvailability['slots'];
    for (const timeSlot of timeSlots) {
      const manuallyAvailable = overrideMap.get(`${date}:${timeSlot}`) ?? true;
      const reserved = bookings.some((booking) =>
        booking.id !== options.excludeBookingId &&
        booking.preferred_date === date &&
        (booking.preferred_time_slot === timeSlot ||
          (!options.ignoreLegacyReservations &&
            legacyTimeSlots[booking.preferred_time_slot || '']?.includes(timeSlot))) &&
        booking.appointment_status !== 'cancelada'
      );

      slots[timeSlot] = {
        available: date >= tomorrow && manuallyAvailable && !reserved,
        reserved,
        manuallyAvailable,
      };
    }

    availability.push({ date, slots });
  }

  return availability;
}

export async function isAppointmentSlotAvailable(
  date: string,
  timeSlot: TimeSlot,
  options: { excludeBookingId?: string; ignoreLegacyReservations?: boolean } = {}
): Promise<boolean> {
  if (!isValidAppointmentDate(date) || !timeSlots.includes(timeSlot)) return false;
  const days = await getAppointmentAvailability(date, 1, options);
  return days[0]?.slots[timeSlot].available || false;
}

export async function setAppointmentSlotAvailability(
  date: string,
  timeSlot: TimeSlot,
  isAvailable: boolean
): Promise<void> {
  if (!isValidAppointmentDate(date) || !timeSlots.includes(timeSlot)) {
    throw new Error('La fecha o franja horaria no es válida.');
  }

  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  if (isAvailable && (date < addDays(getCostaRicaDate(), 1) || weekday === 0 || weekday === 6)) {
    throw new Error('Solo se pueden abrir fechas hábiles futuras.');
  }

  if (isAvailable) {
    const bookings = await getAppointmentBookings();
    const reserved = bookings.some((booking) =>
      booking.preferred_date === date &&
      (booking.preferred_time_slot === timeSlot ||
        legacyTimeSlots[booking.preferred_time_slot || '']?.includes(timeSlot)) &&
      booking.appointment_status !== 'cancelada'
    );
    if (reserved) throw new Error('Esta franja ya tiene una cita solicitada.');
  } else {
    const bookings = await getAppointmentBookings();
    const reserved = bookings.some((booking) =>
      booking.preferred_date === date &&
      (booking.preferred_time_slot === timeSlot ||
        legacyTimeSlots[booking.preferred_time_slot || '']?.includes(timeSlot)) &&
      booking.appointment_status !== 'cancelada'
    );
    if (reserved) throw new Error('No se puede cerrar una hora que tenga una solicitud activa.');
  }

  const adminSupabase = createAdminClient();
  const updatedAt = new Date().toISOString();
  if (adminSupabase) {
    const { error } = await adminSupabase
      .from('appointment_availability')
      .upsert(
        { date, time_slot: timeSlot, is_available: isAvailable, updated_at: updatedAt },
        { onConflict: 'date,time_slot' }
      );

    if (error) throw error;
    return;
  }

  const overrides = getLocalOverrides();
  const index = overrides.findIndex((item) => item.date === date && item.time_slot === timeSlot);
  const nextOverride = { date, time_slot: timeSlot, is_available: isAvailable, updated_at: updatedAt };
  if (index === -1) overrides.push(nextOverride);
  else overrides[index] = nextOverride;
  saveLocalOverrides(overrides);
}