'use client';

import { SocialLinks } from '@/components/SocialLinks';
import { COMPANY, WHATSAPP_URL } from '@/content/company';
import { Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="bg-negro text-slate-300 border-t border-slate-800/80" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Pie de página
      </h2>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 items-start pb-8 border-b border-slate-800/80">
          {/* Columna 1: Branding e Identidad */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/assets/logo-icono.png"
                  alt="Logo oficial ATLÁNTICA & ASOCIADOS"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left">
                <span className="font-serif font-bold text-base tracking-wider text-white block leading-tight">
                  ATLÁNTICA &amp; ASOCIADOS
                </span>
                <span className="text-[10px] tracking-[0.18em] text-dorado block mt-0.5 font-semibold uppercase">
                  Poder y Estrategia
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Asesoría ciudadana, orientación y redacción técnica de documentos ante instituciones públicas en Costa Rica. Trámites 100% digitales y confidenciales.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-dorado font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-dorado" />
              <span>Atención estrictamente confidencial</span>
            </div>

            <div className="pt-2">
              <SocialLinks />
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div className="md:justify-self-center">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3.5 text-dorado">
              Navegación Rápida
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <Link href="/" className="hover:text-dorado transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="hover:text-dorado transition-colors">
                  Servicios de Asesoría
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="hover:text-dorado transition-colors">
                  ¿Cómo Funciona?
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="hover:text-dorado transition-colors">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-dorado transition-colors">
                  Blog & noticias
                </Link>
              </li>
              <li>
                <Link href="/preguntas-frecuentes" className="hover:text-dorado transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Atención Directa */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3.5 text-dorado">
              Atención Directa
            </h3>
            <div className="space-y-3 text-xs">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-slate-200 hover:text-dorado transition-colors group"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span className="font-mono font-bold text-slate-100">{COMPANY.phoneDisplay}</span>
                <span className="text-[11px] text-slate-400">(WhatsApp / Teléfono)</span>
              </a>

              <a
                href={`tel:${COMPANY.secondaryPhone}`}
                className="flex items-center gap-2.5 text-slate-200 hover:text-dorado transition-colors group"
              >
                <Phone className="w-4 h-4 text-dorado" />
                <span className="font-mono font-bold text-slate-100">{COMPANY.secondaryPhoneDisplay}</span>
                <span className="text-[11px] text-slate-400">(Línea Secundaria)</span>
              </a>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">{COMPANY.email}</span>
              </div>

              <div className="pt-2">
                <Link
                  href="/contacto"
                  className="inline-block bg-azul-rey hover:bg-azul-rey-dark text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Cuéntenos su caso por escrito
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior sobria */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} ATLÁNTICA &amp; ASOCIADOS. Todos los derechos reservados. Costa Rica.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/privacidad" className="hover:text-dorado transition-colors">
              Aviso de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
