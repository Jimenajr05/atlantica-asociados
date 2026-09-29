import React from 'react';
import Link from 'next/link';
import { Hospital, Building2, Landmark, Scale, Users, ShieldAlert, CheckCircle2, MessageCircle, ArrowRight } from 'lucide-react';
import { ServiceItem } from '@/content/services';
import { getWhatsAppCustomUrl } from '@/content/company';

interface ServiceCardProps {
  service: ServiceItem;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const renderIcon = () => {
    const iconClass = "w-5 h-5 text-dorado";
    switch (service.icon) {
      case 'hospital':
        return <Hospital className={iconClass} />;
      case 'building':
        return <Building2 className={iconClass} />;
      case 'landmark':
        return <Landmark className={iconClass} />;
      case 'scale':
        return <Scale className={iconClass} />;
      case 'users':
        return <Users className={iconClass} />;
      case 'shield':
      default:
        return <ShieldAlert className={iconClass} />;
    }
  };

  const whatsappInquiryUrl = getWhatsAppCustomUrl(
    `Hola, deseo consultar sobre el trámite de: "${service.title}". ¿Cómo podemos proceder?`
  );

  return (
    <article className="min-h-[390px] bg-white rounded-xl border border-slate-200 border-t-2 border-t-dorado shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col overflow-hidden group">
      <div className="p-6 sm:p-7 flex-1">
        <div className="flex items-center justify-between gap-4 mb-5">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-700">
            {service.badge}
          </span>
          <div className="w-10 h-10 rounded-lg bg-azul-rey flex items-center justify-center flex-shrink-0">
            {renderIcon()}
          </div>
        </div>

        <h3 className="text-lg sm:text-xl font-serif font-bold text-azul-rey mb-2.5 leading-snug">
          {service.title}
        </h3>

        <p className="text-[11px] text-slate-500 font-semibold mb-3 flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-dorado mt-1 flex-shrink-0"></span>
          <span>{service.institutionExample}</span>
        </p>

        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          {service.summary}
        </p>

        <div className="border-t border-slate-100 pt-4 space-y-2.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Le puede servir si
          </p>
          <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
            {service.whenToUse.slice(0, 2).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pie de tarjeta simétrico */}
      <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-2 mt-auto">
        <Link
          href={`/contacto?servicio=${encodeURIComponent(service.id)}`}
          className="text-xs font-bold text-azul-rey hover:text-azul-rey-dark flex items-center gap-1 transition-colors"
        >
          <span>Cuéntenos su caso</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <a
          href={whatsappInquiryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#128C7E] hover:text-[#075E54] bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          aria-label={`Consultar por WhatsApp sobre ${service.title}`}
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
          <span>Consultar</span>
        </a>
      </div>
    </article>
  );
}
