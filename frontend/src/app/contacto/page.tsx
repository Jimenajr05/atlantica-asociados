import React from 'react';
import type { Metadata } from 'next';
import {
  MessageCircle,
  Mail,
  Clock,
  ShieldCheck,
  Phone,
  HelpCircle,
  CheckCircle2,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import { COMPANY, WHATSAPP_URL } from '@/content/company';
import { CaseForm } from '@/components/CaseForm';

export const metadata: Metadata = {
  title: 'Contacto y Consulta | ATLÁNTICA & ASOCIADOS',
  description:
    'Contáctenos por WhatsApp al 6002-4545 / 8451-1030 o envíe su caso en línea. Asesoría, gestión institucional y acompañamiento ciudadano en Costa Rica.',
};

export default function ContactoPage() {
  return (
    <div className="space-y-12 sm:space-y-16 py-12 sm:py-16 bg-[#fafafc]">
      {/* Encabezado */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-azul-rey text-xs font-bold uppercase tracking-wider border border-slate-200">
          <span>{COMPANY.tagline}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-azul-rey">
          Contáctenos y Cuéntenos su Caso
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          {COMPANY.purpose}
        </p>
      </section>

      {/* Grid: Información de contacto lateral + Formulario principal */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna lateral: Canales directos e información (4 columnas) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Tarjeta WhatsApp Principal */}
            <div className="bg-azul-rey rounded-2xl p-6 sm:p-7 text-white shadow-sm space-y-4">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#25D366]" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-dorado">
                  Canal Principal Directo
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  WhatsApp Oficial
                </h2>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  Para consultas rápidas, envío de fotografías de documentos o coordinación de citas.
                </p>
              </div>

              <div className="pt-1">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-5 py-3 rounded-xl font-bold text-sm shadow transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Escribir al {COMPANY.phoneDisplay}</span>
                </a>
              </div>
            </div>

            {/* Tarjeta de Líneas Directas y Horario */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-azul-rey border-b border-slate-100 pb-2 uppercase tracking-wider">
                Datos de Atención
              </h3>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-start gap-3 text-slate-700">
                  <Phone className="w-4 h-4 text-dorado mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="block text-slate-900">Líneas Telefónicas:</strong>
                    <div className="font-mono text-xs font-bold text-azul-rey space-y-0.5 mt-0.5">
                      <div>6002-4545 (Principal / WhatsApp)</div>
                      <div>8451-1030 (Línea Directa)</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-700">
                  <Clock className="w-4 h-4 text-dorado mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="block text-slate-900">Horario de Atención:</strong>
                    <span>{COMPANY.schedule}</span>
                    <span className="block text-slate-400 text-xs">Hora de Costa Rica</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-700">
                  <Receipt className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="block text-slate-900">Facturación Electrónica:</strong>
                    <span className="text-xs text-slate-600">Servicios formales para personas y organizaciones.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-700">
                  <Mail className="w-4 h-4 text-azul-rey mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="block text-slate-900">Correo Electrónico:</strong>
                    <span className="font-mono text-xs break-all text-azul-rey font-semibold">
                      {COMPANY.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso informativo de cita */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-1">
              <strong className="block font-bold text-azul-rey">
                ¿Desea solicitar una cita de orientación?
              </strong>
              <p className="leading-relaxed">
                Marque la casilla dentro del formulario indicando su día y franja horaria preferida (lunes a viernes de 7:00 a.m. a 5:00 p.m.).
              </p>
            </div>
          </div>

          {/* Columna Principal: Formulario de Caso (8 columnas) */}
          <div className="lg:col-span-8">
            <CaseForm />
          </div>
        </div>
      </section>
    </div>
  );
}
