import { PageHero } from '@/components/PageHero';
import { COMPANY } from '@/content/company';
import {
  Clock,
  FileText,
  Phone,
  Receipt
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/nosotros' },
  title: 'Nosotros | ATLÁNTICA & ASOCIADOS - Poder y Estrategia',
  description:
    'Conozca a ATLÁNTICA & ASOCIADOS, nuestra misión, visión, compromiso, valores y servicios de gestión institucional y acompañamiento ciudadano en Costa Rica.',
};

export default function NosotrosPage() {
  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 pb-10 sm:pb-12 lg:pb-16 bg-[#fafafc]">
      <PageHero
        eyebrow={COMPANY.tagline}
        title={COMPANY.name}
        description={COMPANY.motto}
      />

      {/* 2. Presentación y Propósito Institucional */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-sm space-y-6 leading-relaxed text-slate-700">
          <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-medium border-l-4 border-dorado pl-4 py-1">
            {COMPANY.description}
          </p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {COMPANY.purpose}
          </p>
        </div>
      </section>

      {/* 3. Misión y Visión (Texto Exacto) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Misión */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-azul-rey">
              Misión
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {COMPANY.mision}
            </p>
          </div>
        </div>

        {/* Visión */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-azul-rey">
              Visión
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {COMPANY.vision}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Nuestro Compromiso y Valores */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-azul-rey text-white rounded-2xl p-5 sm:p-12 shadow-md space-y-8">
          <div className="space-y-3 text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-dorado block">
              Filosofía de Trabajo
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Nuestro Compromiso
            </h2>
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed italic">
              &ldquo;{COMPANY.commitment}&rdquo;
            </p>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-center text-slate-300 mb-6">
              Valores que Guían Nuestra Gestión
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-center">
              {COMPANY.values.map((val, idx) => (
                <div
                  key={idx}
                  className="flex min-h-16 items-center justify-center bg-white/10 border border-white/15 rounded-xl px-2 sm:px-4 py-3 text-xs sm:text-sm leading-snug font-bold text-white hover:bg-white/20 transition-colors"
                >
                  {val}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Facturación Electrónica y Horario */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Facturación Electrónica */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-3 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-azul-rey">
              Facturación Electrónica Autorizada
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {COMPANY.billing}
            </p>
          </div>
        </div>

        {/* Horario y Teléfonos Directos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-3 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-azul-rey/10 text-azul-rey border border-azul-rey/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-azul-rey">
              Horario &amp; Líneas Directas
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              {COMPANY.schedule}
            </p>
            <div className="pt-1 flex flex-wrap gap-3 text-xs font-mono font-bold text-azul-rey">
              <a href="tel:60024545" className="hover:text-dorado flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-dorado" /> 6002-4545
              </a>
              <span>•</span>
              <a href="tel:84511030" className="hover:text-dorado flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-dorado" /> 8451-1030
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* 7. Descargo legal */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 sm:p-5 flex items-start gap-3">
          <FileText className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-800">Nota institucional:</strong> {COMPANY.legalDisclaimer}
          </p>
        </div>
      </section>
    </div>
  );
}
