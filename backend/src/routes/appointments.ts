import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/require-admin';
import {
  getAppointmentAvailability,
  isValidAppointmentDate,
  setAppointmentSlotAvailability,
} from '../services/appointments-store';
import { APPOINTMENT_TIME_SLOTS, TimeSlot } from '../types';

const router = Router();
const validTimeSlots: readonly TimeSlot[] = APPOINTMENT_TIME_SLOTS;

router.get('/availability', async (req: Request, res: Response): Promise<void> => {
  try {
    const from = typeof req.query.from === 'string' ? req.query.from : '';
    const days = Number(req.query.days || 42);
    if (!isValidAppointmentDate(from) || !Number.isInteger(days) || days < 1 || days > 62) {
      res.status(400).json({ error: 'Indique un rango de fechas válido de hasta 62 días.' });
      return;
    }

    const dates = await getAppointmentAvailability(from, days);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ dates });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'No se pudo consultar la disponibilidad.' });
  }
});

router.put('/availability', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, timeSlot, available } = req.body || {};
    if (
      typeof date !== 'string' ||
      !isValidAppointmentDate(date) ||
      !validTimeSlots.includes(timeSlot) ||
      typeof available !== 'boolean'
    ) {
      res.status(400).json({ error: 'Indique una fecha, franja y disponibilidad válidas.' });
      return;
    }

    await setAppointmentSlotAvailability(date, timeSlot, available);
    res.json({ success: true, date, timeSlot, available });
  } catch (error: any) {
    res.status(409).json({ error: error.message || 'No se pudo actualizar la disponibilidad.' });
  }
});

export default router;