'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import { COMPANY, WHATSAPP_URL } from '@/content/company';

export function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(true);

  if (pathname === '/' || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <aside
      aria-label="Contacto directo por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end group"
    >
      {/* Tooltip informativo inicial para personas preocupadas */}
      {showTooltip && (
        <div className="relative mb-2 hidden sm:flex items-center gap-2 bg-white text-slate-800 text-xs py-2 px-3 rounded-lg shadow-xl border border-slate-200 animate-bounce duration-1000">
          <span className="font-semibold text-azul-rey">¿Tiene dudas sobre su caso?</span>
          <span>Escríbanos directamente</span>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-slate-400 hover:text-slate-600 ml-1 p-0.5"
            aria-label="Cerrar sugerencia de WhatsApp"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45"></div>
        </div>
      )}

      {/* Botón flotante de WhatsApp */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chatear por WhatsApp con Atlántica & Asociados (+506 6002-4545)"
        className="flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_25px_rgba(37,211,102,0.6)] transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        <MessageCircle className="w-7 h-7 fill-white" />
        <span className="sr-only">Escríbanos por WhatsApp al +506 6002-4545</span>
      </a>
    </aside>
  );
}
