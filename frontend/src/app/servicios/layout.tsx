import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/servicios' },
  title: 'Nuestros 17 Servicios | ATLÁNTICA & ASOCIADOS - Poder y Estrategia',
  description:
    'Catálogo completo de 17 servicios de asesoría, gestión institucional, redacción técnica, acompañamiento ciudadano y apoyo en proyectos comunitarios en Costa Rica.',
};

export default function ServiciosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
