'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, FileText, HelpCircle, Briefcase, ArrowRight } from 'lucide-react';
import { SERVICES } from '@/content/services';
import { FAQS } from '@/content/faqs';

type ResultType = 'service' | 'faq' | 'blog';

interface SearchResult {
  type: ResultType;
  id: string;
  title: string;
  excerpt: string;
  href: string;
}

const ICON_MAP: Record<ResultType, React.ReactNode> = {
  service: <Briefcase className="w-4 h-4 text-azul-rey flex-shrink-0" />,
  faq: <HelpCircle className="w-4 h-4 text-dorado flex-shrink-0" />,
  blog: <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
};

const LABEL_MAP: Record<ResultType, string> = {
  service: 'Servicio',
  faq: 'FAQ',
  blog: 'Blog',
};

const BADGE_CLASS: Record<ResultType, string> = {
  service: 'bg-azul-rey/10 text-azul-rey border-azul-rey/20',
  faq: 'bg-dorado/10 text-dorado border-dorado/20',
  blog: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  SERVICES.forEach((s) => {
    results.push({
      type: 'service',
      id: s.id,
      title: s.title,
      excerpt: s.summary,
      href: `/servicios#${s.id}`,
    });
  });

  FAQS.forEach((f) => {
    results.push({
      type: 'faq',
      id: f.id,
      title: f.question,
      excerpt: f.answer.slice(0, 120) + '…',
      href: `/preguntas-frecuentes#${f.id}`,
    });
  });

  return results;
}

const ALL_RESULTS = buildIndex();

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-dorado/25 text-inherit rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const lower = q.toLowerCase();
    const filtered = ALL_RESULTS.filter(
      (r) =>
        r.title.toLowerCase().includes(lower) ||
        r.excerpt.toLowerCase().includes(lower)
    ).slice(0, 10);
    setResults(filtered);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda general"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-negro/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden" style={{animation: 'slideDown 0.18s ease-out'}}>
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/80">
          <Search className="w-5 h-5 text-dorado flex-shrink-0" />
          <input
            ref={inputRef}
            id="search-modal-input"
            type="search"
            placeholder="Buscar servicios, preguntas frecuentes, artículos…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              search(e.target.value);
            }}
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-base focus:outline-none"
            autoComplete="off"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            aria-label="Cerrar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() === '' && (
            <div className="px-6 py-8 text-center text-slate-500 text-sm">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Empiece a escribir para buscar en toda la web.</p>
              <p className="mt-1 text-xs text-slate-600">Servicios · Preguntas frecuentes · Artículos del blog</p>
            </div>
          )}

          {query.trim() !== '' && results.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-500 text-sm">
              <p>No se encontraron resultados para <strong className="text-slate-300">&quot;{query}&quot;</strong>.</p>
              <p className="mt-1 text-xs text-slate-600">Intente con otras palabras.</p>
            </div>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-slate-800">
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    href={r.href}
                    onClick={onClose}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-800/60 transition-colors group"
                  >
                    <span className="mt-0.5">{ICON_MAP[r.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${BADGE_CLASS[r.type]}`}
                        >
                          {LABEL_MAP[r.type]}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white leading-snug group-hover:text-dorado transition-colors truncate">
                        {highlight(r.title, query)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                        {highlight(r.excerpt, query)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-dorado transition-colors flex-shrink-0 mt-1" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-600">
          <span><kbd className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">Esc</kbd> para cerrar</span>
          {results.length > 0 && (
            <span>{results.length} resultado{results.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}
