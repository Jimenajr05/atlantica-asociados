'use client';

import { Check, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<'es' | 'en'>('es');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Detectar cookie de idioma traducido previamente
    const match = document.cookie.match(/(?:^|;)\s*googtrans=([^;]+)/);
    if (match && match[1].includes('/en')) {
      setCurrentLang('en');
    }

    // Callback de inicialización de Google Translate
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'es',
            includedLanguages: 'es,en',
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          'google_translate_element'
        );
      }
    };

    // Insertar script de Google Translate dinámicamente si no existe
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const changeLanguage = (lang: 'es' | 'en') => {
    setCurrentLang(lang);
    setIsOpen(false);

    const targetLang = lang === 'en' ? '/es/en' : '/es/es';
    const domain = window.location.hostname;
    
    // Asignar cookies de traducción
    document.cookie = `googtrans=${targetLang}; path=/; domain=${domain}`;
    document.cookie = `googtrans=${targetLang}; path=/;`;

    // Intentar cambiar el valor en el selector oculto de Google Translate
    const selectElem = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (selectElem) {
      selectElem.value = lang;
      selectElem.dispatchEvent(new Event('change'));
    } else {
      // Si el widget aún se está cargando, recargar suavemente para aplicar la cookie
      window.location.reload();
    }
  };

  return (
    <div className="relative inline-block text-left z-50">
      {/* Contenedor oculto requerido por la API de Google Translate */}
      <div id="google_translate_element" className="hidden" />

      {/* Botón elegante de cambio de idioma */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-dorado transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-dorado"
        aria-expanded={isOpen}
        aria-label="Cambiar idioma / Change language"
      >
        <Globe className="w-3.5 h-3.5 text-dorado" />
        <span className="uppercase tracking-wider font-bold">
          {currentLang === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
        </span>
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-[#0c121e] border border-slate-700/90 shadow-2xl py-1.5 z-50">
          <button
            type="button"
            onClick={() => changeLanguage('es')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
              currentLang === 'es' ? 'text-dorado bg-slate-800/60 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🇪🇸</span> Español
            </span>
            {currentLang === 'es' && <Check className="w-3.5 h-3.5 text-dorado" />}
          </button>

          <button
            type="button"
            onClick={() => changeLanguage('en')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
              currentLang === 'en' ? 'text-dorado bg-slate-800/60 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🇺🇸</span> English
            </span>
            {currentLang === 'en' && <Check className="w-3.5 h-3.5 text-dorado" />}
          </button>
        </div>
      )}
    </div>
  );
}
