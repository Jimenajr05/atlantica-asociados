import React from 'react';
import type { Metadata } from 'next';
import {
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
import { PageHero } from '@/components/PageHero';
import { SocialLinks } from '@/components/SocialLinks';

export const metadata: Metadata = {
  title: 'Contacto y Consulta | ATLÁNTICA & ASOCIADOS',
  description:
    'Contáctenos por WhatsApp al 6002-4545 / 8451-1030 o envíe su caso en línea. Asesoría, gestión institucional y acompañamiento ciudadano en Costa Rica.',
};

export default function ContactoPage() {
  return (
    <div className="space-y-10 sm:space-y-12 lg:space-y-16 pb-10 sm:pb-12 lg:pb-16 bg-[#fafafc]">
      <PageHero
        eyebrow={COMPANY.tagline}
        title="Contáctenos y Cuéntenos su Caso"
        description={COMPANY.purpose}
        asideValue={COMPANY.phoneDisplay}
        asideLabel="línea directa"
      />

      {/* Grid: Información de contacto lateral + Formulario principal */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna lateral: Canales directos e información (4 columnas) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Tarjeta WhatsApp Principal */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 border-t-4 border-t-dorado bg-white shadow-md">
              <div className="bg-azul-rey px-7 pt-7 pb-6 text-white">
                <span className="text-[11px] font-bold uppercase text-dorado">
                  Canal principal directo
                </span>
                <h2 className="mt-3 text-2xl font-serif font-bold text-white">
                  WhatsApp Oficial
                </h2>
                <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                  Para consultas rápidas, envío de fotografías de documentos o coordinación de citas.
                </p>
              </div>

              <div className="px-7 py-6">
                <span className="block text-[10px] font-bold uppercase text-slate-500">
                  Número de contacto
                </span>
                <span className="mt-1 block text-2xl font-semibold font-mono text-azul-rey">
                  {COMPANY.phoneDisplay}
                </span>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Escribir por WhatsApp al ${COMPANY.phoneDisplay}`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#117449] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0d603c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul-rey"
                >
                  Iniciar conversación
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
                      <div>6002-4545 (Principal)</div>
                      <div>8451-1030 </div>
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

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Redes Sociales:</span>
                  <SocialLinks />
                </div>
              </div>
            </div>

            {/* Aviso informativo de cita */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-1">
              <strong className="block font-bold text-azul-rey">
                ¿Desea solicitar una cita de orientación?
              </strong>
              <p className="leading-relaxed">
                Marque la casilla del formulario, elija un día en el calendario y seleccione una hora disponible. Las citas duran una hora y se atienden de lunes a viernes entre 7:00 a.m. y 5:00 p.m.
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
