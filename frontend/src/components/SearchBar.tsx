'use client';

import { FAQS } from '@/content/faqs';
import { SERVICES } from '@/content/services';
import { ArrowRight, Briefcase, FileText, HelpCircle, Search, X } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';

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
    results.push({ type: 'service', id: s.id, title: s.title, excerpt: s.summary, href: `/servicios#${s.id}` });
  });
  FAQS.forEach((f) => {
    results.push({ type: 'faq', id: f.id, title: f.question, excerpt: f.answer.slice(0, 120) + '...', href: `/preguntas-frecuentes#${f.id}` });
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
      <mark key={i} className="bg-dorado/25 text-inherit rounded px-0.5">{part}</mark>
    ) : part
  );
}

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SearchResult[]>(ALL_RESULTS);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const lower = q.toLowerCase();
    setResults(
      index.filter(
        (r) => r.title.toLowerCase().includes(lower) || r.excerpt.toLowerCase().includes(lower)
      ).slice(0, 8)
    );
  }, [index]);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    fetch('/api/posts', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudieron consultar los artículos.');
        return response.json();
      })
      .then((data: { posts?: { id: string; slug: string; title: string; excerpt: string }[] }) => {
        if (!Array.isArray(data.posts)) return;
        setIndex([...ALL_RESULTS, ...data.posts.map((post): SearchResult => ({
          type: 'blog', id: `post-${post.id}`, title: post.title,
          excerpt: post.excerpt || '', href: `/blog/${encodeURIComponent(post.slug)}`,
        }))]);
      })
      .catch(() => { /* La búsqueda de servicios y preguntas sigue disponible. */ });
    return () => controller.abort();
  }, [isOpen]);

  useEffect(() => { search(query); }, [query, search]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setTimeout(() => { setQuery(''); setResults([]); }, 250);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const hasQuery = query.trim() !== '';

  return (
    <>
      {/* Overlay sutil */}
      <div
        className={`fixed inset-0 z-30 bg-negro/40 backdrop-blur-[2px] transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel desplegable debajo del header */}
      <div
        ref={containerRef}
        className={`absolute left-0 right-0 top-full z-40 px-4 sm:px-6 lg:px-8 transition-all duration-[250ms] ease-out origin-top ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-3 pointer-events-none'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#0d1117] border border-slate-700/80 border-t-0 rounded-b-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">

            {/* Input */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800">
              <Search className="w-5 h-5 text-dorado flex-shrink-0" />
              <input
                ref={inputRef}
                id="search-inline-input"
                type="text"
                placeholder="Buscar servicios, preguntas, articulos..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
                autoComplete="off"
              />
              {hasQuery && (
                <button
                  onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                  className="p-1 rounded-full hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"
                  aria-label="Limpiar busqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Contenido */}
            <div className="max-h-[55vh] overflow-y-auto">


              {hasQuery && results.length === 0 && (
                <div className="px-6 py-6 text-center text-slate-500 text-sm">
                  <p>No hay resultados para <strong className="text-slate-300">&ldquo;{query}&rdquo;</strong>.</p>
                  <p className="mt-1 text-xs text-slate-600">Intente con otras palabras clave.</p>
                </div>
              )}

              {results.length > 0 && (
                <ul className="divide-y divide-slate-800/80">
                  {results.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={r.href}
                        onClick={onClose}
                        className="flex items-start gap-3 px-5 py-3 hover:bg-slate-800/50 transition-colors group"
                      >
                        <span className="mt-0.5">{ICON_MAP[r.type]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${BADGE_CLASS[r.type]}`}>
                              {LABEL_MAP[r.type]}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-white leading-snug group-hover:text-dorado transition-colors truncate">
                            {highlight(r.title, query)}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
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

            {results.length > 0 && (
              <div className="px-5 py-2 border-t border-slate-800/80 flex items-center justify-end text-[10px] text-slate-500">
                <span>{results.length} resultado{results.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
