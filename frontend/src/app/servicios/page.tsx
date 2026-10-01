'use client';

import { PageHero } from '@/components/PageHero';
import { ServiceCard } from '@/components/ServiceCard';
import { COMPANY, WHATSAPP_URL } from '@/content/company';
import { SERVICES } from '@/content/services';
import { FileText, MessageCircle, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

// All unique badges for filter chips
const ALL_BADGES = Array.from(new Set(SERVICES.map((s) => s.badge)));

const SERVICES_PER_PAGE = 10;

export default function ServiciosPage() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1); }, [query, activeFilter]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return SERVICES.filter((s) => {
      const matchesQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.whenToUse.some((w) => w.toLowerCase().includes(q)) ||
        s.whatWeDeliver.some((w) => w.toLowerCase().includes(q));

      const matchesFilter = !activeFilter || s.badge === activeFilter;
      return matchesQuery && matchesFilter;
    });
  }, [query, activeFilter]);

  const totalPages = Math.ceil(filtered.length / SERVICES_PER_PAGE) || 1;
  const paginatedServices = filtered.slice(
    (currentPage - 1) * SERVICES_PER_PAGE,
    currentPage * SERVICES_PER_PAGE
  );

  return (
    <div className="space-y-10 sm:space-y-12 pb-10 sm:pb-16 bg-[#fafafc]">
      <PageHero
        eyebrow={COMPANY.tagline}
        title="Servicios para resolver sus gestiones con claridad"
        description={COMPANY.purpose}
        asideValue={String(SERVICES.length).padStart(2, '0')}
        asideLabel="servicios disponibles"
      />

      {/* Buscador + filtros de servicios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dorado">
              Catálogo de servicios
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl font-serif font-bold text-azul-rey">
              Encuentre el apoyo que necesita
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {filtered.length} de {SERVICES.length} servicios
          </span>
        </div>

        {/* Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            id="services-search-input"
            type="search"
            placeholder="Buscar servicios por nombre, categoría o descripción…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-azul-rey/40 focus:border-azul-rey text-sm transition"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros por categoría en todos los dispositivos */}
        <div className="relative">
          {/* Fade derecha */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#fafafc] to-transparent z-10" />
          <div className="flex items-center gap-2 overflow-x-auto p-1 scrollbar-none">
            <button
              aria-pressed={activeFilter === null}
              onClick={() => setActiveFilter(null)}
              className={`min-h-11 flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                activeFilter === null
                  ? 'bg-[#e1e9f3] text-[#163664] border-[#163664] ring-1 ring-[#163664]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-azul-rey hover:text-azul-rey'
              }`}
            >
              Todos · {SERVICES.length}
            </button>
            {ALL_BADGES.map((badge) => {
              const count = SERVICES.filter((s) => s.badge === badge).length;
              return (
                <button
                  key={badge}
                  aria-pressed={activeFilter === badge}
                  onClick={() => setActiveFilter(activeFilter === badge ? null : badge)}
                  className={`min-h-11 flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                    activeFilter === badge
                      ? 'bg-[#e1e9f3] text-[#163664] border-[#163664] ring-1 ring-[#163664]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-azul-rey/60 hover:text-azul-rey'
                  }`}
                >
                  {badge}{count > 1 ? ` · ${count}` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contador de resultados */}
        {(query || activeFilter) && (
          <p className="text-xs text-slate-400">
            {filtered.length === 0
              ? 'No se encontraron servicios.'
              : `${filtered.length} servicio${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
            {query && (
              <span> para <strong className="text-slate-600">&quot;{query}&quot;</strong></span>
            )}
          </p>
        )}
      </section>

      {/* Grid de servicios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {paginatedServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>

            {/* Paginación de servicios */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  ← Anterior
                </button>
                <span className="text-sm font-bold text-azul-rey">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium text-slate-500">Sin resultados</p>
            <p className="text-sm mt-1">Pruebe con otras palabras o limpie los filtros.</p>
            <button
              onClick={() => { setQuery(''); setActiveFilter(null); }}
              className="mt-4 px-4 py-2 bg-azul-rey text-white text-sm rounded-lg font-semibold hover:bg-azul-rey-dark transition-colors"
            >
              Ver todos los servicios
            </button>
          </div>
        )}
      </section>

      {/* Bloque de Facturación Electrónica y Asesoría Personalizada */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-10 shadow-sm space-y-6 text-center">
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

          <div className="mobile-action-row pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span className="sm:hidden">WhatsApp</span>
              <span className="hidden sm:inline">Consultar trámite por WhatsApp</span>
            </a>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 bg-azul-rey hover:bg-azul-rey-dark text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-colors"
            >
              <FileText className="w-4 h-4 text-dorado" />
              <span className="sm:hidden">Enviar caso</span>
              <span className="hidden sm:inline">Enviar caso por formulario</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
