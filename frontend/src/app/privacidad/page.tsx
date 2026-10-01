import { COMPANY } from '@/content/company';
import { PRIVACY_CONTENT } from '@/content/privacy';
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: '/privacidad' },
  title: 'Aviso de Privacidad y Términos del Servicio',
  description:
    'Política de confidencialidad, tratamiento de datos sensibles de salud y condiciones del servicio en línea de Atlántica & Asociados.',
};

export default function PrivacidadPage() {
  return (
    <div className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-azul-rey hover:text-dorado transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la página principal</span>
      </Link>

      {/* Cabecera */}
      <div className="border-b border-slate-200 pb-6 space-y-3">
        <div className="flex items-center gap-2 text-dorado text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Documento Legal y Confidencialidad
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-azul-rey">
          {PRIVACY_CONTENT.title}
        </h1>
        <p className="text-xs text-slate-400">
          Última actualización: {PRIVACY_CONTENT.lastUpdated}
        </p>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed pt-2">
          {PRIVACY_CONTENT.summary}
        </p>
      </div>

      {/* Secciones de la Política */}
      <div className="space-y-8">
        {PRIVACY_CONTENT.sections.map((section, idx) => (
          <section key={idx} className="space-y-3 bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-azul-rey flex items-center gap-2">
              {section.title}
            </h2>
            <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </section>
        ))}
      </div>

      {/* Recuadro de descargo legal requerido al pie */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 space-y-3 border border-dorado/40 shadow-lg">
        <div className="flex items-center gap-2 text-dorado font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-dorado flex-shrink-0" />
          <span>Descargo de Responsabilidad Profesional</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {COMPANY.legalDisclaimer}
        </p>
      </div>
    </div>
  );
}
