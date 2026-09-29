import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MessageSquareText,
  SearchCheck,
  FileSignature,
  CheckCircle,
  MessageCircle,
  Clock,
  ShieldCheck,
  Send,
  HelpCircle,
} from 'lucide-react';
import { COMPANY, WHATSAPP_URL } from '@/content/company';
import { PageHero } from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Cómo Funciona Nuestro Servicio de Gestión y Redacción',
  description:
    'Conozca paso a paso cómo trabajamos su caso: desde el primer mensaje por WhatsApp o formulario, el análisis técnico, la preparación del documento hasta el seguimiento.',
};

export default function ComoFuncionaPage() {
  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 pb-12 sm:pb-16 lg:pb-20">
      <PageHero
        eyebrow="Metodología transparente"
        title="¿Cómo funciona nuestro servicio?"
        description="Diseñamos un proceso en cuatro pasos claros, sin enredos jurídicos ni trámites complicados, pensado para personas ocupadas y preocupadas."
        asideValue="04"
        asideLabel="pasos de atención"
      />

      {/* Los 4 Pasos Detallados */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Paso 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card flex flex-col md:flex-row gap-6 items-start">
          <div className="w-14 h-14 rounded-2xl bg-azul-rey text-dorado flex items-center justify-center font-serif font-extrabold text-2xl flex-shrink-0 shadow-md">
            1
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-dorado" />
              <h2 className="text-xl sm:text-2xl font-bold text-azul-rey">
                Paso 1: Cuéntenos su caso
              </h2>
            </div>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              El primer paso es sencillo: escríbanos por WhatsApp al <strong>{COMPANY.phoneDisplay}</strong> o complete nuestro formulario seguro en línea. No necesita saber términos legales ni artículos de leyes; explíquenos qué le pasó, con cuál institución y qué le respondieron.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-xs sm:text-sm text-slate-700 border border-slate-200">
              <span className="font-bold text-azul-rey block mb-1">¿Qué puede adjuntar?</span>
              Fotografías claras o archivos de cartas anteriores, colillas de citas médicas, notas municipales o resoluciones. Si prefiere que conversemos primero, puede marcar la casilla para solicitar una cita en horario hábil.
            </div>
          </div>
        </div>

        {/* Paso 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card flex flex-col md:flex-row gap-6 items-start">
          <div className="w-14 h-14 rounded-2xl bg-azul-rey text-dorado flex items-center justify-center font-serif font-extrabold text-2xl flex-shrink-0 shadow-md">
            2
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <SearchCheck className="w-5 h-5 text-dorado" />
              <h2 className="text-xl sm:text-2xl font-bold text-azul-rey">
                Paso 2: Lo analizamos
              </h2>
            </div>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Revisamos los antecedentes a profundidad. Determinamos con exactitud qué derecho está siendo lesionado, cuál es la oficina o jerarca competente que debe resolver, y cuál es la vía más rápida y efectiva:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700 pt-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-dorado"></span>
                <span>Petición formal Art. 27 constitucional</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-dorado"></span>
                <span>Recurso de amparo ante la Sala IV</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-dorado"></span>
                <span>Reclamo administrativo municipal</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-dorado"></span>
                <span>Gestión ante Contraloría de Servicios</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Paso 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card flex flex-col md:flex-row gap-6 items-start">
          <div className="w-14 h-14 rounded-2xl bg-azul-rey text-dorado flex items-center justify-center font-serif font-extrabold text-2xl flex-shrink-0 shadow-md">
            3
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-dorado" />
              <h2 className="text-xl sm:text-2xl font-bold text-azul-rey">
                Paso 3: Preparamos su documento
              </h2>
            </div>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Elaboramos el documento formal con una redacción impecable, fundamentación legal y señalamiento expreso de los plazos de respuesta obligatorios por ley.
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Le enviamos el archivo en formato digital (PDF o Word) listo para imprimir y firmar, o para enviar directamente por los canales electrónicos habilitados por la entidad. Le incluimos una guía paso a paso sobre cómo y dónde presentarlo.
            </p>
          </div>
        </div>

        {/* Paso 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card flex flex-col md:flex-row gap-6 items-start">
          <div className="w-14 h-14 rounded-2xl bg-azul-rey text-dorado flex items-center justify-center font-serif font-extrabold text-2xl flex-shrink-0 shadow-md">
            4
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-dorado" />
              <h2 className="text-xl sm:text-2xl font-bold text-azul-rey">
                Paso 4: Le damos seguimiento
              </h2>
            </div>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              No nos desentendemos de su caso una vez entregado el documento. Le indicamos cuándo vence el plazo legal de la institución y qué hacer según el tipo de respuesta que le brinden.
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Si la institución responde con evasivas o no contesta en el plazo fijado por ley, le asesoramos inmediatamente para escalar la gestión ante la Sala Constitucional o la Defensoría de los Habitantes.
            </p>
          </div>
        </div>
      </section>

      {/* Banner de inicio directo */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-azul-rey text-white rounded-2xl p-8 sm:p-10 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold">
            ¿Listo para dar el primer paso hoy mismo?
          </h2>
          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto">
            Cuéntenos su situación y le ayudaremos a encauzarla por la vía correcta.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Escribir por WhatsApp</span>
            </a>
            <Link
              href="/contacto"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-azul-rey hover:bg-slate-100 px-8 py-3.5 rounded-xl font-bold transition-colors"
            >
              <Send className="w-4 h-4 text-dorado" />
              <span>Enviar caso por formulario</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
