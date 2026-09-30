'use client';

import { useEffect, useState } from 'react';
import {
  APPOINTMENT_TIME_SLOTS,
  AppointmentDayAvailability,
  AppointmentSlotAvailability,
  AppointmentStatus,
  AppointmentTimePreference,
  CaseRecord,
  LegacyTimeSlot,
  TimeSlot,
} from '@/types';
import { adminFetch } from '@/lib/admin-fetch';
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MessageCircle,
  X,
} from 'lucide-react';

interface AppointmentAgendaProps {
  cases: CaseRecord[];
  initialDate?: string;
  onAppointmentStatusChange: (caseId: string, status: AppointmentStatus) => Promise<void>;
  onAppointmentTimeChange: (caseId: string, timeSlot: TimeSlot) => Promise<void>;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

function formatAppointmentTime(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  const suffix = hour < 12 ? 'a.m.' : 'p.m.';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function isLegacyTimePreference(value?: AppointmentTimePreference | null): value is LegacyTimeSlot {
  return value === 'manana' || value === 'tarde';
}

function formatTimeRange(value?: string | null) {
  if (value === 'manana') return 'mañana · hora por asignar';
  if (value === 'tarde') return 'tarde · hora por asignar';
  if (!value || !APPOINTMENT_TIME_SLOTS.includes(value as TimeSlot)) return 'hora por asignar';
  const start = value;
  const endHour = Number(start.slice(0, 2)) + 1;
  return `${formatAppointmentTime(start)} – ${formatAppointmentTime(`${String(endHour).padStart(2, '0')}:00`)}`;
}

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCostaRicaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return localDateString(value);
}

function getCalendarDates(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const first = new Date(year, monthNumber - 1, 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, monthNumber - 1, 1 - mondayOffset, 12);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return localDateString(date);
  }).filter((date) => {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    return weekday !== 0 && weekday !== 6;
  });
}

function formatDate(date: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-CR', options);
}

function getAppointmentStatus(caseItem: CaseRecord): AppointmentStatus {
  return caseItem.appointment_status || 'pendiente';
}

function getBulkAvailabilityAction(day: AppointmentDayAvailability | undefined, timeSlots: readonly TimeSlot[]) {
  const changeableSlots = timeSlots
    .map((timeSlot) => day?.slots[timeSlot])
    .filter((slot): slot is AppointmentSlotAvailability => Boolean(slot && !slot.reserved));

  if (changeableSlots.length === 0) return null;
  return changeableSlots.every((slot) => !slot.manuallyAvailable) ? 'open' : 'close';
}

function getWhatsAppUrl(caseItem: CaseRecord, intent: 'confirm' | 'cancel' = 'confirm') {
  const digits = caseItem.phone.replace(/\D/g, '');
  const phone = digits.startsWith('506') ? digits : `506${digits}`;
  const firstName = caseItem.full_name.trim().split(/\s+/)[0];
  const date = formatDate(caseItem.preferred_date || '', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timePreference = caseItem.preferred_time_slot;
  const time = isLegacyTimePreference(timePreference)
    ? `el horario preferido de la ${timePreference === 'manana' ? 'mañana' : 'tarde'}; la hora exacta está pendiente de coordinar`
    : timePreference
      ? `la hora ${formatTimeRange(timePreference)}`
      : 'una hora pendiente de asignar';
  const message = intent === 'cancel'
    ? `Hola ${firstName}, lamentamos informarle que debemos cancelar su solicitud de cita de orientación para el ${date} en ${time}. Por favor escríbanos para coordinar una nueva fecha. Atlántica & Asociados.`
    : isLegacyTimePreference(timePreference) || !timePreference
      ? `Hola ${firstName}, recibimos su solicitud de cita para el ${date} en ${time}. Nos comunicaremos para coordinar la hora exacta. Atlántica & Asociados.`
      : `Hola ${firstName}, le confirmamos su cita de orientación para el ${date} a ${formatTimeRange(timePreference)}. Le atenderemos por este medio. Atlántica & Asociados.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function AppointmentAgenda({ cases, initialDate = '', onAppointmentStatusChange, onAppointmentTimeChange }: AppointmentAgendaProps) {
  const [month, setMonth] = useState(() => (initialDate || localDateString(new Date())).slice(0, 7));
  const [schedule, setSchedule] = useState<AppointmentDayAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [scheduleVersion, setScheduleVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [savingBulkClose, setSavingBulkClose] = useState(false);
  const [availabilityNotice, setAvailabilityNotice] = useState<string | null>(null);
  const [activeCaseAction, setActiveCaseAction] = useState<string | null>(null);
  const [legacyTimeSelection, setLegacyTimeSelection] = useState<Record<string, TimeSlot | ''>>({});
  const [cancelTarget, setCancelTarget] = useState<CaseRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calendarDates = getCalendarDates(month);
  const scheduleByDate = new Map(schedule.map((day) => [day.date, day]));
  const selectedDay = scheduleByDate.get(selectedDate);
  const today = getCostaRicaDate();
  const firstBookableDate = addDays(today, 1);
  const morningSlots = APPOINTMENT_TIME_SLOTS.slice(0, 6);
  const afternoonSlots = APPOINTMENT_TIME_SLOTS.slice(6);
  const bulkSlotGroups = [
    { label: 'día', timeSlots: APPOINTMENT_TIME_SLOTS, action: getBulkAvailabilityAction(selectedDay, APPOINTMENT_TIME_SLOTS) },
    { label: 'mañana', timeSlots: morningSlots, action: getBulkAvailabilityAction(selectedDay, morningSlots) },
    { label: 'tarde', timeSlots: afternoonSlots, action: getBulkAvailabilityAction(selectedDay, afternoonSlots) },
  ] as const;
  const selectedDayCases = cases
    .filter((caseItem) => caseItem.appointment_requested && caseItem.preferred_date === selectedDate)
    .sort((left, right) => (left.preferred_time_slot || '').localeCompare(right.preferred_time_slot || ''));
  const monthLabel = formatDate(`${month}-01`, { month: 'long', year: 'numeric' });

  useEffect(() => {
    const controller = new AbortController();
    const firstDate = getCalendarDates(month)[0];
    setLoading(true);
    setErrorMessage(null);

    fetch(`/api/appointments/availability?from=${firstDate}&days=42`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudo cargar la agenda.');
        return result.dates as AppointmentDayAvailability[];
      })
      .then((dates) => {
        setSchedule(dates);
        setSelectedDate((current) => {
          if (dates.some((day) => day.date === current)) return current;
          return dates.find((day) => day.date >= firstBookableDate)?.date || dates[0]?.date || '';
        });
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setErrorMessage(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [month, scheduleVersion]);

  const handleAvailabilityChange = async (date: string, timeSlot: TimeSlot, available: boolean) => {
    const key = `${date}:${timeSlot}`;
    setSavingSlot(key);
    setErrorMessage(null);
    try {
      const response = await adminFetch('/api/appointments/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, timeSlot, available }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo actualizar la disponibilidad.');
      setScheduleVersion((version) => version + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo actualizar la disponibilidad.');
    } finally {
      setSavingSlot(null);
    }
  };

  const handleBulkToggle = async (label: string, requestedSlots: readonly TimeSlot[]) => {
    const action = getBulkAvailabilityAction(selectedDay, requestedSlots);
    if (!action) {
      setAvailabilityNotice('No hay horas disponibles para cambiar; las reservas se mantienen.');
      return;
    }

    const shouldOpen = action === 'open';
    const slotsToClose = requestedSlots.filter((timeSlot) => {
      const slot = selectedDay?.slots[timeSlot];
      return slot && !slot.reserved && slot.manuallyAvailable !== shouldOpen;
    });

    if (!selectedDate || slotsToClose.length === 0) {
      setAvailabilityNotice('No hay horas disponibles para cambiar; las reservas se mantienen.');
      return;
    }

    setSavingBulkClose(true);
    setErrorMessage(null);
    setAvailabilityNotice(null);
    let closedCount = 0;

    try {
      for (const timeSlot of slotsToClose) {
        const response = await adminFetch('/api/appointments/availability', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: selectedDate, timeSlot, available: shouldOpen }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `No se pudo cambiar ${formatAppointmentTime(timeSlot)}.`);
        closedCount += 1;
      }
      setAvailabilityNotice(`Se ${shouldOpen ? 'abrieron' : 'cerraron'} ${closedCount} horas de ${label}. Las solicitudes existentes no se modificaron.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cambiar todas las horas.');
      if (closedCount > 0) {
        setAvailabilityNotice(`Se cambiaron ${closedCount} horas antes del error. Las solicitudes existentes no se modificaron.`);
      }
    } finally {
      if (closedCount > 0) setScheduleVersion((version) => version + 1);
      setSavingBulkClose(false);
    }
  };

  const handleMarkConfirmed = async (caseItem: CaseRecord) => {
    setActiveCaseAction(caseItem.id);
    setErrorMessage(null);
    try {
      await onAppointmentStatusChange(caseItem.id, 'confirmada');
      setScheduleVersion((version) => version + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo confirmar la cita.');
    } finally {
      setActiveCaseAction(null);
    }
  };

  const handleAssignTime = async (caseItem: CaseRecord) => {
    const selectedTime = legacyTimeSelection[caseItem.id];
    if (!selectedTime) return;
    setActiveCaseAction(caseItem.id);
    setErrorMessage(null);
    try {
      await onAppointmentTimeChange(caseItem.id, selectedTime);
      setLegacyTimeSelection((current) => ({ ...current, [caseItem.id]: '' }));
      setScheduleVersion((version) => version + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo asignar la hora.');
    } finally {
      setActiveCaseAction(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setActiveCaseAction(cancelTarget.id);
    setErrorMessage(null);
    try {
      await onAppointmentStatusChange(cancelTarget.id, 'cancelada');
      setCancelTarget(null);
      setScheduleVersion((version) => version + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cancelar la solicitud.');
    } finally {
      setActiveCaseAction(null);
    }
  };

  return (
    <section className="space-y-5" aria-labelledby="appointment-agenda-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="appointment-agenda-title" className="font-serif text-xl font-bold text-azul-rey sm:text-2xl">
            Agenda de citas
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Administre franjas disponibles y atienda las solicitudes recibidas.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span>Mes</span>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs"
          />
        </label>
      </div>

      {errorMessage && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold capitalize text-slate-800">{monthLabel}</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">Puntos verdes: horas disponibles</p>
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-azul-rey" aria-label="Cargando agenda" />}
          </div>

          <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="py-2 text-center text-[10px] font-bold uppercase text-slate-500">
                {weekday}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-px bg-slate-200">
            {calendarDates.map((date) => {
              const day = scheduleByDate.get(date);
              const inMonth = date.startsWith(month);
              const hasRequestOnDate = cases.some((caseItem) =>
                caseItem.appointment_requested && caseItem.preferred_date === date
              );
              const canSelect = Boolean(day) && (date >= firstBookableDate || hasRequestOnDate);
              const isSelected = selectedDate === date;
              const dateBookings = cases.filter((item) =>
                item.appointment_requested &&
                item.preferred_date === date &&
                getAppointmentStatus(item) !== 'cancelada'
              );
              const availableCount = day
                ? APPOINTMENT_TIME_SLOTS.filter((timeSlot) => day.slots[timeSlot].available).length
                : 0;
              const hasReservation = Boolean(day && Object.values(day.slots).some((slot) => slot.reserved)) || dateBookings.length > 0;

              return (
                <button
                  key={date}
                  type="button"
                  disabled={!inMonth || !canSelect}
                  aria-pressed={isSelected}
                  aria-label={`${formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}. ${availableCount} horas disponibles. ${hasReservation ? 'Tiene una cita solicitada.' : ''}`}
                  onClick={() => setSelectedDate(date)}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 bg-white px-0.5 py-2 text-xs transition-colors sm:min-h-16 ${
                    !inMonth || !canSelect
                      ? 'cursor-default text-slate-300'
                      : isSelected
                        ? 'bg-azul-rey-50 text-azul-rey ring-1 ring-inset ring-azul-rey/50'
                        : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`font-semibold tabular-nums ${!inMonth ? 'opacity-40' : ''}`}>
                    {Number(date.slice(-2))}
                  </span>
                  {inMonth && day && (
                    <span className="flex items-center gap-1" aria-hidden="true">
                      <span className={`h-1.5 w-1.5 rounded-full ${availableCount > 0 ? 'bg-emerald-500' : hasReservation ? 'bg-amber-500' : 'bg-slate-200'}`} />
                      <span className={`text-[8px] leading-none ${isSelected ? 'text-azul-rey' : availableCount > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {availableCount}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 px-4 py-2.5 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Disponible</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Reservada</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-200" />Cerrada</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold capitalize text-slate-800">
              {selectedDate ? formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Seleccione un día'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">Cierre horas sueltas o un bloque completo; las reservas se respetan.</p>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {bulkSlotGroups.map((group) => (
              <button
                key={group.label}
                type="button"
                disabled={!selectedDate || selectedDate < firstBookableDate || !group.action || savingBulkClose || loading}
                onClick={() => handleBulkToggle(group.label === 'día' ? 'todo el día' : `la ${group.label}`, group.timeSlots)}
                className="min-h-9 rounded-md border border-slate-300 bg-white px-1 py-2 text-[10px] font-semibold text-slate-700 transition-colors hover:border-azul-rey/40 hover:bg-azul-rey-50 disabled:opacity-45"
              >
                {group.action === 'open' ? 'Abrir' : 'Cerrar'} {group.label}
              </button>
            ))}
          </div>

          {availabilityNotice && (
            <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
              {availabilityNotice}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
          {APPOINTMENT_TIME_SLOTS.map((timeSlot) => {
            const slot = selectedDay?.slots[timeSlot];
            const actionKey = `${selectedDate}:${timeSlot}`;
            const isPast = selectedDate < firstBookableDate;
            return (
              <div key={timeSlot} className="min-w-0 rounded-md border border-slate-200 bg-white p-2.5">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tabular-nums text-slate-800">{formatAppointmentTime(timeSlot)}</p>
                    <p className={`mt-0.5 text-[10px] font-medium ${slot?.reserved ? 'text-amber-700' : slot?.available ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {slot?.reserved ? 'Reservada' : slot?.available ? 'Disponible' : 'Cerrada'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!slot || slot.reserved || isPast || savingSlot === actionKey || savingBulkClose || loading}
                    onClick={() => slot && handleAvailabilityChange(selectedDate, timeSlot, !slot.manuallyAvailable)}
                    aria-label={`${slot?.manuallyAvailable ? 'Cerrar' : 'Abrir'} ${formatAppointmentTime(timeSlot)}`}
                    title={slot?.manuallyAvailable ? 'Cerrar esta hora' : 'Abrir esta hora'}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingSlot === actionKey || savingBulkClose ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : slot?.manuallyAvailable ? (
                      <Ban className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Solicitudes del día</h4>
              <span className="text-[11px] tabular-nums text-slate-500">{selectedDayCases.length}</span>
            </div>
            {selectedDayCases.length === 0 ? (
              <p className="py-3 text-xs text-slate-500">No hay solicitudes para esta fecha.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {selectedDayCases.map((caseItem) => {
                  const status = getAppointmentStatus(caseItem);
                  const pending = status === 'pendiente';
                  const canceled = status === 'cancelada';
                  const legacyPreference = isLegacyTimePreference(caseItem.preferred_time_slot);
                  const assignableSlots = APPOINTMENT_TIME_SLOTS.filter((timeSlot) => {
                    const inRequestedWindow = caseItem.preferred_time_slot === 'manana'
                      ? Number(timeSlot.slice(0, 2)) < 13
                      : caseItem.preferred_time_slot === 'tarde'
                        ? Number(timeSlot.slice(0, 2)) >= 13
                        : true;
                    const slot = selectedDay?.slots[timeSlot];
                    const reservedByExactCase = cases.some((otherCase) =>
                      otherCase.id !== caseItem.id &&
                      otherCase.appointment_requested &&
                      otherCase.preferred_date === selectedDate &&
                      otherCase.preferred_time_slot === timeSlot &&
                      getAppointmentStatus(otherCase) !== 'cancelada'
                    );
                    return inRequestedWindow && slot?.manuallyAvailable && !reservedByExactCase;
                  });
                  return (
                    <li key={caseItem.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{caseItem.full_name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatTimeRange(caseItem.preferred_time_slot)} · {caseItem.phone}
                        </p>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          pending ? 'bg-amber-50 text-amber-800' : canceled ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {pending ? 'Pendiente' : canceled ? 'Cancelada' : 'Confirmada'}
                        </span>
                      </div>
                      {!canceled && (
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <a
                            href={getWhatsAppUrl(caseItem)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 px-2.5 py-2 text-[11px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {pending && legacyPreference ? 'Coordinar hora por WhatsApp' : pending ? 'Preparar WhatsApp' : 'Abrir WhatsApp'}
                          </a>
                          {pending && !legacyPreference && (
                            <button
                              type="button"
                              disabled={activeCaseAction === caseItem.id}
                              onClick={() => handleMarkConfirmed(caseItem)}
                              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-2.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
                            >
                              {activeCaseAction === caseItem.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Marcar confirmada
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={activeCaseAction === caseItem.id}
                            onClick={() => setCancelTarget(caseItem)}
                            className="rounded-md border border-slate-300 px-2.5 py-2 text-[11px] font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                          >
                            Cancelar cita
                          </button>
                        </div>
                      )}
                      {pending && legacyPreference && (
                        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 sm:w-full">
                          <select
                            value={legacyTimeSelection[caseItem.id] || ''}
                            onChange={(event) => setLegacyTimeSelection((current) => ({
                              ...current,
                              [caseItem.id]: event.target.value as TimeSlot | '',
                            }))}
                            disabled={selectedDate < firstBookableDate || assignableSlots.length === 0}
                            aria-label={`Asignar hora para ${caseItem.full_name}`}
                            className="min-w-0 rounded-md border border-slate-300 bg-white px-2 py-2 text-xs disabled:bg-slate-100"
                          >
                            <option value="">{assignableSlots.length ? 'Asignar hora exacta' : 'Sin horas para asignar'}</option>
                            {assignableSlots.map((timeSlot) => (
                              <option key={timeSlot} value={timeSlot}>{formatAppointmentTime(timeSlot)}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!legacyTimeSelection[caseItem.id] || activeCaseAction === caseItem.id}
                            onClick={() => handleAssignTime(caseItem)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-azul-rey px-2.5 py-2 text-[11px] font-semibold text-white hover:bg-azul-rey-dark disabled:opacity-50"
                          >
                            {activeCaseAction === caseItem.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Asignar
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="cancel-appointment-title" className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <div>
              <h3 id="cancel-appointment-title" className="font-semibold text-slate-900">¿Cancelar esta cita?</h3>
              <p className="mt-1 text-sm text-slate-600">
                Avise al cliente por WhatsApp y luego confirme para liberar la franja.
              </p>
            </div>
            <a
              href={getWhatsAppUrl(cancelTarget, 'cancel')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#128C7E] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#0f776b]"
            >
              <MessageCircle className="h-4 w-4" />
              Avisar al cliente por WhatsApp
            </a>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={() => setCancelTarget(null)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                Volver
              </button>
              <button type="button" disabled={activeCaseAction === cancelTarget.id} onClick={handleCancel} className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {activeCaseAction === cancelTarget.id ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
