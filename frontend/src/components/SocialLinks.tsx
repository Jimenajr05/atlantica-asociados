import React from 'react';

interface SocialLinksProps {
  // Configurable: actualmente desactivado según requerimiento, fácil de activar cambiando este flag o pasando prop
  enabled?: boolean;
  className?: string;
}

export function SocialLinks({ enabled = false, className = '' }: SocialLinksProps) {
  if (!enabled) {
    // Componente preparado para activarse en el futuro
    return null;
  }

  const socialChannels = [
    { name: 'Facebook', href: 'https://facebook.com', icon: 'FB' },
    { name: 'Instagram', href: 'https://instagram.com', icon: 'IG' },
    { name: 'LinkedIn', href: 'https://linkedin.com', icon: 'IN' },
  ];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {socialChannels.map((item) => (
        <a
          key={item.name}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-dorado text-slate-300 hover:text-negro flex items-center justify-center text-xs font-bold transition-colors"
          aria-label={`Visitar nuestro perfil de ${item.name}`}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
