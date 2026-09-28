import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { FaqAccordion } from '@/components/FaqAccordion';
import { FAQS } from '@/content/faqs';
import { COMPANY, WHATSAPP_URL } from '@/content/company';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes sobre Trámites y Asesoría Ciudadana',
  description:
    'Respuestas sencillas sobre cómo empezar, cuánto tarda un documento, qué papeles adjuntar, confidencialidad de datos y citas.',
};

export default function PreguntasFrecuentesPage() {
  return (
    <div className="space-y-12 sm:space-y-16 py-12 sm:py-16">
      {/* Encabezado */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold tracking-widest uppercase text-dorado-muted block">
          Orientación sin Enredos
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-azul-rey">
          Preguntas Frecuentes
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
          Encuentre aquí respuestas claras y directas a las dudas que surgen con más frecuencia al iniciar una gestión con nosotros.
        </p>
      </section>

      {/* Acordeón Completo con Schema.org FAQPage */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <FaqAccordion items={FAQS} />
      </section>

      {/* Bloque inferior: ¿Tiene otra consulta? */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-azul-rey text-dorado mx-auto flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold text-azul-rey">
            ¿Tiene una duda particular que no ve reflejada aquí?
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Escríbanos con total confianza a nuestro WhatsApp oficial y le responderemos con gusto durante nuestro horario de atención.
          </p>
          <div className="pt-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-6 py-3 rounded-xl font-bold text-sm shadow transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Preguntar por WhatsApp al {COMPANY.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
