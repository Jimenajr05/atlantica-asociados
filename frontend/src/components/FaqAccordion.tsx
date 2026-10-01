'use client';

import { FAQS, FaqItem } from '@/content/faqs';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface FaqAccordionProps {
  items?: FaqItem[];
  limit?: number;
}

export function FaqAccordion({ items = FAQS, limit }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Primera abierta por defecto para facilitar lectura
  const displayItems = limit ? items.slice(0, limit) : items;

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  // Marcado estructurado Schema.org FAQPage
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: displayItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      {/* Script JSON-LD para SEO y Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="space-y-3.5">
        {displayItems.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.id}
              id={faq.id}
              className={`scroll-mt-32 rounded-xl border transition-all duration-200 overflow-hidden bg-white ${
                isOpen
                  ? 'border-azul-rey/40 shadow-md ring-1 ring-azul-rey/20'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${faq.id}`}
                id={`faq-btn-${faq.id}`}
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${isOpen ? 'text-dorado' : 'text-slate-400'}`} />
                  <span className="font-semibold text-azul-rey text-base sm:text-lg leading-snug">
                    {faq.question}
                  </span>
                </div>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 bg-azul-rey text-dorado' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div
                  id={`faq-answer-${faq.id}`}
                  role="region"
                  aria-labelledby={`faq-btn-${faq.id}`}
                  className="px-5 pb-6 sm:px-6 sm:pb-6 pt-0 text-slate-700 text-sm sm:text-base leading-relaxed border-t border-slate-100 mt-1"
                >
                  <div className="pl-8 pt-3 text-slate-600">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
