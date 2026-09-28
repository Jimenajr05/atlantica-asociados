import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircle, FileText, CheckCircle2, Phone, Receipt } from 'lucide-react';
import { SERVICES } from '@/content/services';
import { ServiceCard } from '@/components/ServiceCard';
import { COMPANY, WHATSAPP_URL } from '@/content/company';

export const metadata: Metadata = {
  title: 'Nuestros 17 Servicios | ATLÁNTICA & ASOCIADOS - Poder y Estrategia',
  description:
    'Catálogo completo de 17 servicios de asesoría, gestión institucional, redacción técnica, acompañamiento ciudadano y apoyo en proyectos comunitarios en Costa Rica.',
};

export default function ServiciosPage() {
  return (
    <div className="space-y-16 py-12 sm:py-16 bg-[#fafafc]">
      {/* Cabecera de Página */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-azul-rey text-xs font-bold uppercase tracking-wider border border-slate-200">
          <span>{COMPANY.tagline}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-azul-rey">
          Nuestros 17 Servicios
        </h1>
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
          {COMPANY.purpose}
        </p>
      </section>

      {/* Grid con los 17 servicios (Todos con la misma importancia y jerarquía visual) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* Bloque de Facturación Electrónica y Asesoría Personalizada */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm space-y-6 text-center">
          <div className="space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-dorado block">
              Formalidad y Respaldo
            </span>
            <h2 className="text-2xl font-serif font-bold text-azul-rey">
              Servicios formales con Facturación Electrónica
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {COMPANY.billing}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Consultar trámite por WhatsApp</span>
            </a>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 bg-azul-rey hover:bg-azul-rey-dark text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-colors"
            >
              <FileText className="w-4 h-4 text-dorado" />
              <span>Enviar caso por formulario</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
