'use client';

import { getWhatsAppCustomUrl } from '@/content/company';
import { SERVICES } from '@/content/services';
import {
  MAX_FILES_COUNT,
  MAX_TOTAL_FILE_SIZE,
  validateClientFile
} from '@/lib/validations/case';
import { AppointmentDayAvailability, TimeSlot } from '@/types';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  UploadCloud,
  X
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useId, useState } from 'react';

function getMinDateString() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const date = new Date(`${values.year}-${values.month}-${values.day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function formatAppointmentDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-CR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function getCalendarDates(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  first.setUTCDate(first.getUTCDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(first.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  }).filter((date) => {
    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    return weekday !== 0 && weekday !== 6;
  });
}

function formatAppointmentTime(timeSlot: TimeSlot) {
  const [hour, minute] = timeSlot.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'a.m.' : 'p.m.'}`;
}

async function fetchAppointmentAvailability(from: string, signal?: AbortSignal) {
  const response = await fetch(
    `/api/appointments/availability?from=${encodeURIComponent(from)}&days=42`,
    { signal }
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudo consultar la disponibilidad.');
  return result.dates as AppointmentDayAvailability[];
}

export function CaseForm() {
  const formId = useId();

  // Campos principales
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [description, setDescription] = useState('');
  useEffect(() => {
    const serviceId = new URLSearchParams(window.location.search).get('servicio');
    const service = SERVICES.find((item) => item.id === serviceId);
    if (service) setDescription(`Consulta sobre ${service.title}: `);
  }, []);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Solicitud condicional de cita
  const [appointmentRequested, setAppointmentRequested] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<TimeSlot | ''>('');
  const [appointmentCalendarMonth, setAppointmentCalendarMonth] = useState(() => getMinDateString().slice(0, 7));
  const [appointmentAvailability, setAppointmentAvailability] = useState<AppointmentDayAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Honeypot anti-spam (oculto)
  const [honeypot, setHoneypot] = useState('');

  // Manejo de archivos
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Estados de envío y respuesta
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    caseCode: string;
    message: string;
    appointmentRequested: boolean;
  } | null>(null);

  useEffect(() => {
    if (!appointmentRequested) return;

    const controller = new AbortController();
    setLoadingAvailability(true);
    setAvailabilityError(null);
    fetchAppointmentAvailability(getCalendarDates(appointmentCalendarMonth)[0], controller.signal)
      .then((dates) => setAppointmentAvailability(dates))
      .catch((error: Error) => {
        if (!controller.signal.aborted) {
          setAvailabilityError(error.message || 'No se pudo consultar la disponibilidad.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingAvailability(false);
      });

    return () => controller.abort();
  }, [appointmentRequested, appointmentCalendarMonth]);

  const changeAppointmentMonth = (offset: number) => {
    const monthDate = new Date(`${appointmentCalendarMonth}-01T12:00:00`);
    monthDate.setMonth(monthDate.getMonth() + offset);
    setAppointmentCalendarMonth(`${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`);
    setPreferredDate('');
    setPreferredTimeSlot('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);

    if (files.length + selectedFiles.length > MAX_FILES_COUNT) {
      setFileError(`Solo puede adjuntar un máximo de ${MAX_FILES_COUNT} archivos.`);
      return;
    }

    for (const f of selectedFiles) {
      const validation = validateClientFile(f);
      if (!validation.valid) {
        setFileError(validation.error || 'Archivo inválido.');
        return;
      }
    }

    if ([...files, ...selectedFiles].reduce((total, file) => total + file.size, 0) > MAX_TOTAL_FILE_SIZE) {
      setFileError('Los documentos juntos no pueden superar 4 MB. Reduzca el tamaño de los archivos.');
      return;
    }
    setFiles((prev) => [...prev, ...selectedFiles]);
    e.target.value = ''; // Reset input para permitir reelección
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Validación básica previa en cliente
    if (!fullName.trim() || fullName.trim().length < 3) {
      setServerError('Por favor ingrese su nombre y apellidos completos.');
      return;
    }

    if (!phone.trim() || phone.trim().length < 8) {
      setServerError('Por favor ingrese un número de teléfono o WhatsApp de al menos 8 dígitos.');
      return;
    }

    if (!description.trim() || description.trim().length < 15) {
      setServerError('Por favor explique brevemente los detalles de su caso (al menos 15 caracteres).');
      return;
    }

    if (!privacyAccepted) {
      setServerError('Debe marcar la casilla aceptando el aviso de privacidad.');
      return;
    }

    if (appointmentRequested) {
      if (!preferredDate) {
        setServerError('Por favor elija el día preferido para su cita (lunes a viernes).');
        return;
      }
      const dayOfWeek = new Date(preferredDate + 'T12:00:00').getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        setServerError('Las citas se atienden de lunes a viernes (7:00 a.m. a 5:00 p.m.). Por favor elija un día hábil.');
        return;
      }
      if (!preferredTimeSlot) {
        setServerError('Por favor seleccione una hora disponible para su cita.');
        return;
      }
      const selectedDay = appointmentAvailability.find((day) => day.date === preferredDate);
      if (!selectedDay?.slots[preferredTimeSlot].available) {
        setServerError('Esa franja ya no está disponible. Actualice las fechas y seleccione otra opción.');
        return;
      }
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('institution', institution);
      formData.append('description', description);
      formData.append('privacyAccepted', String(privacyAccepted));
      formData.append('appointmentRequested', String(appointmentRequested));
      formData.append('preferredDate', preferredDate);
      formData.append('preferredTimeSlot', preferredTimeSlot);
      formData.append('websiteUrlHoneypot', honeypot); // Campo trampa anti-spam

      // Adjuntar archivos
      files.forEach((file) => {
        formData.append('files', file);
      });

      // En producción se envía directamente al backend para conservar la IP del cliente.
      const apiOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
      const response = await fetch(`${apiOrigin}/api/cases`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409 && appointmentRequested) {
          setPreferredDate('');
          setPreferredTimeSlot('');
          setLoadingAvailability(true);
          fetchAppointmentAvailability(getCalendarDates(appointmentCalendarMonth)[0])
            .then((dates) => setAppointmentAvailability(dates))
            .catch((error: Error) => setAvailabilityError(error.message))
            .finally(() => setLoadingAvailability(false));
        }
        throw new Error(result.error || 'Ocurrió un error al procesar el caso.');
      }

      setSuccessData({
        caseCode: result.caseCode || 'CASO-RECIBIDO',
        message: result.message || 'Caso recibido correctamente.',
        appointmentRequested,
      });

      // Limpiar formulario tras éxito
      setFullName('');
      setPhone('');
      setEmail('');
      setInstitution('');
      setDescription('');
      setFiles([]);
      setAppointmentRequested(false);
      setPreferredDate('');
      setPreferredTimeSlot('');
    } catch (err: any) {
      setServerError(err.message || 'No pudimos enviar su caso. Por favor revise su conexión o intente por WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableAppointmentDates = appointmentAvailability.filter((day) =>
    Object.values(day.slots).some((slot) => slot.available)
  );
  const selectedAppointmentDay = availableAppointmentDates.find((day) => day.date === preferredDate);
  const calendarDates = getCalendarDates(appointmentCalendarMonth);
  const minimumBookableDate = getMinDateString();
  const minimumMonth = minimumBookableDate.slice(0, 7);
  const calendarMonthLabel = new Date(`${appointmentCalendarMonth}-01T12:00:00`).toLocaleDateString('es-CR', {
    month: 'long',
    year: 'numeric',
  });

  // Si ya se envió exitosamente, mostrar mensaje de confirmación claro y botón directo a WhatsApp
  if (successData) {
    const followUpMessage = `Hola, acabo de enviar mi caso a través de su sitio web. Mi número de referencia es: ${successData.caseCode}. Quería confirmar si ya lo recibieron y dar seguimiento.`;
    const whatsappFollowUpUrl = getWhatsAppCustomUrl(followUpMessage);

    return (
      <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 sm:p-10 shadow-xl text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold tracking-widest uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ¡Caso Recibido con Éxito!
          </span>
          <h3 className="text-2xl font-serif font-bold text-azul-rey">
            Estamos revisando su situación
          </h3>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Hemos registrado su información de forma confidencial. Un asesor examinará los antecedentes y se pondrá en contacto con usted a la mayor brevedad posible.
          </p>
        </div>

        {/* Tarjeta de Código de Caso */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto">
          <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">
            Su número de gestión:
          </span>
          <span className="text-2xl font-mono font-black text-azul-rey tracking-wider">
            {successData.caseCode}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">
            Guarde este código para cualquier consulta o seguimiento.
          </p>
        </div>

        {successData.appointmentRequested && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-md mx-auto text-xs text-amber-800">
            ℹ️ <strong>Cita solicitada:</strong> Nos pondremos en contacto vía WhatsApp para confirmar la hora solicitada.
          </div>
        )}

        {/* Acciones de continuidad */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={whatsappFollowUpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>Continuar por WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => setSuccessData(null)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors"
          >
            Enviar otra consulta
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-slate-200/90 bg-white p-4 shadow-card sm:space-y-6 sm:rounded-2xl sm:p-9"
      noValidate
    >
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-azul-rey">
          Formulario de Consulta Confidencial
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete los campos a continuación. Los campos con asterisco (<span className="text-red-500">*</span>) son obligatorios.
        </p>
      </div>

      {serverError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700 leading-snug">{serverError}</p>
        </div>
      )}

      {/* Campo Trampa Anti-Spam (Honeypot) - Oculto para humanos, los bots lo llenan */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${formId}-website`}>No complete este campo</label>
        <input
          type="text"
          id={`${formId}-website`}
          name="website_url_hp"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Nombre Completo */}
        <div>
          <label htmlFor={`${formId}-fullname`} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            id={`${formId}-fullname`}
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej. María Fernández Solís"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-azul-rey focus:ring-1 focus:ring-azul-rey text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50"
          />
        </div>

        {/* Teléfono / WhatsApp */}
        <div>
          <label htmlFor={`${formId}-phone`} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Teléfono o WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            id={`${formId}-phone`}
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej. 60024545 o 8888-8888"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-azul-rey focus:ring-1 focus:ring-azul-rey text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50"
          />
        </div>

        {/* Correo Electrónico (Opcional) */}
        <div>
          <label htmlFor={`${formId}-email`} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Correo electrónico <span className="text-slate-400 font-normal">(Opcional)</span>
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-azul-rey focus:ring-1 focus:ring-azul-rey text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50"
          />
        </div>

        {/* Institución Involucrada (Opcional) */}
        <div>
          <label htmlFor={`${formId}-institution`} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Institución involucrada <span className="text-slate-400 font-normal">(Opcional)</span>
          </label>
          <input
            id={`${formId}-institution`}
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="Ej. CCSS Hospital México, Municipalidad de Pococí, etc."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-azul-rey focus:ring-1 focus:ring-azul-rey text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Descripción del Caso */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={`${formId}-description`} className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Descripción de su caso <span className="text-red-500">*</span>
          </label>
          <span className="text-[11px] text-slate-400">Cuéntenos con sus palabras qué ocurrió</span>
        </div>
        <textarea
          id={`${formId}-description`}
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describa qué trámite necesita, qué fechas o gestiones previas tiene, y qué respuesta le dio la institución..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-azul-rey focus:ring-1 focus:ring-azul-rey text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50 leading-relaxed"
        />
      </div>

      {/* Adjuntar documentos: hasta 5 archivos y 4 MB en total. */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Adjuntar documentos o fotos <span className="text-slate-400 font-normal">(Opcional, máx. 5 archivos, 4 MB en total)</span>
        </label>

        <div className="border-2 border-dashed border-slate-300 hover:border-dorado rounded-xl p-4 sm:p-6 text-center transition-colors bg-slate-50/60">
          <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Haga clic para seleccionar o arrastre sus archivos aquí
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Formatos admitidos: PDF, JPG, PNG, DOC y DOCX (Hasta 4 MB entre todos los archivos).
          </p>
          <input
            type="file"
            id={`${formId}-file-input`}
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor={`${formId}-file-input`}
            className="mt-3 inline-block cursor-pointer px-4 py-1.5 bg-white border border-slate-300 hover:border-azul-rey rounded-lg text-xs font-bold text-azul-rey shadow-sm transition-colors"
          >
            Examinar archivos en su dispositivo
          </label>
        </div>

        {fileError && (
          <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {fileError}
          </p>
        )}

        {/* Lista de archivos seleccionados */}
        {files.length > 0 && (
          <ul className="mt-3 space-y-2" aria-label="Archivos adjuntos seleccionados">
            {files.map((file, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 text-xs border border-slate-200"
              >
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  <FileText className="w-4 h-4 text-azul-rey flex-shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{file.name}</span>
                  <span className="text-slate-500 text-[10px] flex-shrink-0">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                  aria-label={`Eliminar archivo ${file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SECCIÓN CONDICIONAL: Solicitar Cita */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={appointmentRequested}
            onChange={(e) => setAppointmentRequested(e.target.checked)}
            className="w-4 h-4 text-azul-rey rounded border-slate-300 focus:ring-dorado mt-0.5"
          />
          <div>
            <span className="text-sm font-bold text-azul-rey block">
              Deseo solicitar una cita de orientación previa
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              Si necesita hablar directamente con nosotros, elija en el calendario un día y una hora disponible. Cada cita dura una hora y la confirmación se realizará luego por WhatsApp.
            </span>
          </div>
        </label>

        {appointmentRequested && (
          <div className="pt-3 border-t border-slate-200 space-y-4 animate-fadeIn">
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-dorado" /> Seleccione una fecha disponible
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeAppointmentMonth(-1)}
                    disabled={appointmentCalendarMonth <= minimumMonth}
                    aria-label="Mes anterior"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-28 text-center text-xs font-semibold capitalize text-slate-700">{calendarMonthLabel}</span>
                  <button
                    type="button"
                    onClick={() => changeAppointmentMonth(1)}
                    aria-label="Mes siguiente"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-100/70">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((weekday) => (
                    <span key={weekday} className="py-2 text-center text-[10px] font-bold uppercase text-slate-500">
                      {weekday}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-px bg-slate-200">
                  {calendarDates.map((date) => {
                    const day = appointmentAvailability.find((item) => item.date === date);
                    const inMonth = date.startsWith(appointmentCalendarMonth);
                    const availableCount = day
                      ? Object.values(day.slots).filter((slot) => slot.available).length
                      : 0;
                    const selectable = date >= minimumBookableDate && availableCount > 0;
                    const selected = preferredDate === date;
                    return (
                      <button
                        key={date}
                        type="button"
                        disabled={!inMonth || !selectable || loadingAvailability}
                        aria-pressed={selected}
                        aria-label={`${formatAppointmentDate(date)}${selectable ? `, ${availableCount} horas disponibles` : ', sin disponibilidad'}`}
                        onClick={() => {
                          setPreferredDate(date);
                          setPreferredTimeSlot('');
                        }}
                        className={`flex min-h-11 flex-col items-center justify-center gap-0.5 bg-white py-1 text-xs transition-colors sm:min-h-12 ${
                          !inMonth
                            ? 'cursor-default text-slate-300'
                            : selected
                                ? 'bg-azul-rey-50 text-azul-rey ring-1 ring-inset ring-azul-rey/50'
                              : selectable
                                ? 'font-semibold text-slate-700 hover:bg-azul-rey-50'
                                : 'cursor-not-allowed text-slate-300'
                        }`}
                      >
                        <span className="tabular-nums">{Number(date.slice(-2))}</span>
                        {inMonth && (
                          <span className={`text-[8px] leading-none ${selected ? 'text-azul-rey' : selectable ? 'text-emerald-700' : 'text-slate-300'}`}>
                            {loadingAvailability ? '· · ·' : selectable ? availableCount : '—'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Número verde: horas libres
                </span>
                {loadingAvailability && <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Consultando</span>}
              </div>
              {availabilityError && <p role="alert" className="mt-2 text-xs text-red-600">{availabilityError}</p>}
              {!loadingAvailability && availableAppointmentDates.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">No hay fechas disponibles durante este mes.</p>
              )}
            </div>

            {preferredDate && (
              <div>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-dorado" /> Seleccione una hora
                  </label>
                  <span className="text-[11px] capitalize text-slate-500">{formatAppointmentDate(preferredDate)}</span>
                </div>
                {selectedAppointmentDay ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {Object.entries(selectedAppointmentDay.slots)
                      .filter(([, slot]) => slot.available)
                      .map(([timeSlot]) => {
                        const slot = timeSlot as TimeSlot;
                        const selected = preferredTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setPreferredTimeSlot(slot)}
                            className={`min-h-10 rounded-md border px-2 py-2 text-xs font-semibold tabular-nums transition-colors ${
                              selected
                                ? 'border-azul-rey bg-azul-rey text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-azul-rey hover:text-azul-rey'
                            }`}
                          >
                            {formatAppointmentTime(slot)}
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                    {loadingAvailability ? 'Actualizando horas disponibles...' : 'No quedan horas disponibles para este día.'}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-slate-500">
                  Cada cita dura una hora. Horario de atención: 7:00 a.m. a 5:00 p.m.
                </p>
              </div>
            )}

            {availabilityError && preferredDate && (
              <p className="text-xs text-red-600">{availabilityError}</p>
            )}
          </div>
        )}
      </div>

      {/* Casilla Obligatoria de Aviso de Privacidad y Sensibilidad */}
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            required
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="w-4 h-4 text-azul-rey rounded border-slate-300 focus:ring-dorado mt-0.5"
          />
          <div className="text-xs text-slate-600 leading-relaxed">
            He leído y acepto el{' '}
            <Link href="/privacidad" target="_blank" className="text-azul-rey font-bold underline hover:text-dorado">
              Aviso de Privacidad y Términos del Servicio
            </Link>
            . Entiendo que los documentos aportados se resguardan de forma privada y que el caso puede incluir información sensible (por ejemplo, de salud o vulnerabilidad).
          </div>
        </label>
      </div>

      {/* Botón de Envío */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-6 rounded-xl bg-azul-rey hover:bg-azul-rey-dark text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed border-b-2 border-dorado"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Enviando información segura...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5 text-dorado" />
              <span>Enviar caso para análisis</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center pt-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>Tratamiento confidencial garantizado. Sus documentos nunca se harán públicos.</span>
      </div>
    </form>
  );
}
