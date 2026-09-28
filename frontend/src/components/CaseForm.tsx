'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import {
  Send,
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock,
  MessageCircle,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { COMPANY, getWhatsAppCustomUrl } from '@/content/company';
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILES_COUNT,
  validateClientFile,
} from '@/lib/validations/case';

interface CaseFormProps {
  preselectedServiceId?: string;
}

export function CaseForm({ preselectedServiceId }: CaseFormProps) {
  const formId = useId();

  // Campos principales
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [description, setDescription] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Solicitud condicional de cita
  const [appointmentRequested, setAppointmentRequested] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<'manana' | 'tarde' | ''>('');

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

  // Calcular la fecha mínima para el selector (mañana hábil)
  const getMinDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
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
        setServerError('Por favor seleccione si prefiere la mañana o la tarde para su cita.');
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

      const response = await fetch('/api/cases', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
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
            ℹ️ <strong>Cita solicitada:</strong> Nos pondremos en contacto vía WhatsApp para confirmar la hora exacta dentro de la franja horaria indicada.
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
      className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-9 space-y-6"
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

      {/* Adjuntar Documentos (Opcional - Máximo 5 archivos, 10MB c/u) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Adjuntar documentos o fotos <span className="text-slate-400 font-normal">(Opcional, máx. 5 archivos de 10 MB)</span>
        </label>

        <div className="border-2 border-dashed border-slate-300 hover:border-dorado rounded-xl p-4 sm:p-6 text-center transition-colors bg-slate-50/60">
          <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Haga clic para seleccionar o arrastre sus archivos aquí
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Formatos admitidos: PDF, JPG, PNG, DOC y DOCX (Hasta 10 MB por archivo).
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
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
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
              Si necesita hablar directamente con nosotros, seleccione su día y franja horaria preferida. La confirmación se realizará luego por WhatsApp.
            </span>
          </div>
        </label>

        {appointmentRequested && (
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
            {/* Día Preferido */}
            <div>
              <label htmlFor={`${formId}-preferred-date`} className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-dorado" /> Día preferido (Lunes a Viernes)
              </label>
              <input
                type="date"
                id={`${formId}-preferred-date`}
                required={appointmentRequested}
                min={getMinDateString()}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-azul-rey focus:ring-1 focus:ring-azul-rey bg-white"
              />
            </div>

            {/* Franja Horaria Preferida */}
            <div>
              <label htmlFor={`${formId}-preferred-slot`} className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-dorado" /> Franja horaria
              </label>
              <select
                id={`${formId}-preferred-slot`}
                required={appointmentRequested}
                value={preferredTimeSlot}
                onChange={(e) => setPreferredTimeSlot(e.target.value as 'manana' | 'tarde')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-azul-rey focus:ring-1 focus:ring-azul-rey bg-white"
              >
                <option value="">Seleccione una franja</option>
                <option value="manana">Mañana (7:00 a.m. a 12:00 m.d.)</option>
                <option value="tarde">Tarde (1:00 p.m. a 5:00 p.m.)</option>
              </select>
            </div>
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
