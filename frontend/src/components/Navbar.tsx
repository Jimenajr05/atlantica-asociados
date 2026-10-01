'use client';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SearchBar } from '@/components/SearchBar';
import { COMPANY, WHATSAPP_URL } from '@/content/company';
import { Clock, Menu, MessageCircle, Phone, Search, ShieldCheck, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { name: 'Inicio', href: '/' },
  { name: 'Servicios', href: '/servicios' },
  { name: 'Cómo funciona', href: '/como-funciona' },
  { name: 'Nosotros', href: '/nosotros' },
  { name: 'Blog & noticias', href: '/blog' },
  { name: 'Contacto', href: '/contacto' },
];

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {/* ── Topbar informativa ─────────────────────────────── */}
      <div className="bg-[#06090e] text-slate-300 text-xs py-2 px-4 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1.5 sm:gap-2">
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-[11px] sm:text-xs">
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
          <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end gap-2 sm:gap-3 text-[10px] sm:text-xs ml-0 sm:ml-auto">
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
            <span className="text-slate-700">|</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* ── Header principal (sticky) ───────────────────────── */}
      {/*
        Usamos un wrapper sticky para que SearchBar se posicione
        correctamente justo debajo del header sin romper el layout.
      */}
      <div className={`sticky top-0 z-40 w-full`}>
        <header
          className={`w-full bg-negro border-b transition-all duration-300 ${
            scrolled ? 'shadow-lg border-slate-800' : 'border-slate-800/80'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-1.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado rounded-lg p-0.5 sm:p-1 flex-shrink-0"
              aria-label="Atlántica & Asociados - Inicio"
            >
              <div className="relative w-7 h-7 sm:w-10 sm:h-10 flex-shrink-0">
                <Image
                  src="/assets/logo-icono.png"
                  alt="Símbolo oficial Atlántica & Asociados"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-serif font-bold text-[12px] sm:text-lg tracking-normal sm:tracking-wider text-white leading-tight group-hover:text-dorado transition-colors whitespace-nowrap">
                  ATLÁNTICA &amp; ASOCIADOS
                </span>
                <span className="text-[9px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.18em] text-dorado font-semibold uppercase leading-tight">
                  Poder y Estrategia
                </span>
              </div>
            </Link>

            {/* Nav desktop — centrada */}
            <nav
              className="hidden xl:flex items-center gap-0.5 flex-1 justify-center"
              aria-label="Navegación principal"
            >
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'text-dorado bg-slate-900 border-b-2 border-dorado font-semibold'
                        : 'text-slate-300 hover:text-dorado hover:bg-slate-900/70'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Acciones desktop */}
            <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
              {/* Lupita */}
              <button
                onClick={() => setSearchOpen((p) => !p)}
                id="search-open-btn"
                className={`p-2 rounded-full transition-all duration-200 ${
                  searchOpen
                    ? 'text-dorado bg-slate-800 ring-1 ring-dorado/40'
                    : 'text-slate-400 hover:text-dorado hover:bg-slate-800'
                }`}
                aria-label={searchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
                aria-expanded={searchOpen}
              >
                <Search className="w-5 h-5" />
              </button>

              <Link
                href="/contacto"
                className="text-xs font-semibold text-slate-200 hover:text-dorado px-3 py-2 transition-colors border border-slate-700 hover:border-dorado/50 rounded-lg whitespace-nowrap"
              >
                Cuéntenos su caso
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition-all hover:scale-[1.02] whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Escríbanos</span>
              </a>
            </div>

            {/* Acciones móvil / tablet */}
            <div className="flex xl:hidden items-center gap-0.5">
              <button
                onClick={() => { setSearchOpen((p) => !p); setMobileMenuOpen(false); }}
                className={`p-1.5 rounded-lg transition-colors ${
                  searchOpen
                    ? 'text-dorado bg-slate-900'
                    : 'text-slate-400 hover:text-dorado hover:bg-slate-900'
                }`}
                aria-label={searchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
                aria-expanded={searchOpen}
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setMobileMenuOpen((p) => !p); setSearchOpen(false); }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-dorado hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-dorado"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </header>

        {/* ── SearchBar desplegable (dentro del sticky wrapper) ── */}
        <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* ── Menú móvil desplegable ──────────────────────────── */}
        <div
          className={`xl:hidden bg-negro border-t border-slate-800 overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pt-3 pb-6 space-y-1">
            <nav className="flex flex-col space-y-0.5" aria-label="Menú móvil">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-dorado font-bold border-l-4 border-dorado'
                        : 'text-slate-200 hover:bg-slate-900/80 hover:text-dorado'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mobile-action-row pt-4 border-t border-slate-800 grid grid-cols-2 gap-2">
              <Link
                href="/contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center text-center py-2.5 px-2 rounded-lg bg-azul-rey text-white font-semibold text-sm hover:bg-azul-rey-dark transition-colors"
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
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
