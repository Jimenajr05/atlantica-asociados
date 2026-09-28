'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, MessageCircle, Phone, Clock, ShieldCheck } from 'lucide-react';
import { COMPANY, WHATSAPP_URL } from '@/content/company';

const NAV_LINKS = [
  { name: 'Inicio', href: '/' },
  { name: 'Servicios', href: '/servicios' },
  { name: 'Cómo funciona', href: '/como-funciona' },
  { name: 'Nosotros', href: '/nosotros' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contacto', href: '/contacto' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* Barra superior de atención con Facturación Electrónica y Líneas Directas */}
      <div className="bg-[#06090e] text-slate-300 text-xs py-2 px-4 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center flex-wrap gap-3 sm:gap-4 text-[11px] sm:text-xs">
            <span className="inline-flex items-center gap-1.5 text-dorado font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Asesoría Ciudadana Confidencial</span>
            </span>
            <span className="hidden md:inline text-slate-700">|</span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{COMPANY.schedule}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs ml-auto">
            <span className="hidden sm:inline text-slate-400">Atención Directa:</span>
            <a
              href={`tel:${COMPANY.phone}`}
              className="text-white hover:text-dorado font-mono font-bold flex items-center gap-1 transition-colors"
            >
              <Phone className="w-3 h-3 text-dorado" /> {COMPANY.phoneDisplay}
            </a>
            <span className="text-slate-700">/</span>
            <a
              href={`tel:${COMPANY.secondaryPhone}`}
              className="text-white hover:text-dorado font-mono font-bold flex items-center gap-1 transition-colors"
            >
              <Phone className="w-3 h-3 text-dorado" /> {COMPANY.secondaryPhoneDisplay}
            </a>
          </div>
        </div>
      </div>

      {/* Encabezado principal - Logo original flotante y transparente sin marco ni cuadrado */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 bg-negro border-b ${scrolled ? 'shadow-lg border-slate-800 py-2.5' : 'border-slate-800/80 py-3.5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo transparente sin fondo ni contenedor cuadrado */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-dorado rounded-lg p-1"
            aria-label="Atlántica & Asociados - Inicio"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0">
              <Image
                src="/assets/logo-icono.png"
                alt="Símbolo oficial Atlántica & Asociados"
                width={44}
                height={44}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="flex flex-col justify-center text-center">
              <span className="font-serif font-bold text-base sm:text-lg tracking-wider text-white leading-tight group-hover:text-dorado transition-colors">
                ATLÁNTICA &amp; ASOCIADOS
              </span>
              <span className="text-[11px] tracking-[0.18em] text-dorado font-semibold uppercase leading-tight text-center block">
                Poder y Estrategia
              </span>
            </div>
          </Link>

          {/* Menú de navegación desktop */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${isActive
                      ? 'text-dorado bg-slate-900 border-b-2 border-dorado font-semibold'
                      : 'text-slate-200 hover:text-dorado hover:bg-slate-900/70'
                    }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Botones de acción desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/contacto"
              className="text-xs font-semibold text-slate-200 hover:text-dorado px-3 py-2 transition-colors border border-slate-700 hover:border-dorado/50 rounded-lg"
            >
              Cuéntenos su caso
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition-all transform hover:scale-[1.02]"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Escríbanos</span>
            </a>
          </div>

          {/* Botón menú móvil */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-dorado hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-dorado"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menú desplegable móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-negro border-t border-slate-800 px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
            <nav className="flex flex-col space-y-1" aria-label="Menú móvil">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`block px-3 py-2.5 rounded-lg text-base font-medium ${isActive
                        ? 'bg-slate-900 text-dorado font-bold border-l-4 border-dorado'
                        : 'text-slate-200 hover:bg-slate-900/80 hover:text-dorado'
                      }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
              <Link
                href="/contacto"
                className="w-full text-center py-2.5 px-4 rounded-lg bg-azul-rey text-white font-semibold text-sm hover:bg-azul-rey-dark transition-colors"
              >
                Cuéntenos su caso
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 px-4 rounded-lg text-sm font-semibold shadow transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Escríbanos por WhatsApp ({COMPANY.phoneDisplay})</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
