import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Cinzel } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppFloatingButton } from '@/components/WhatsAppFloatingButton';
import { COMPANY } from '@/content/company';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://atlanticayasociados.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Atlántica & Asociados | Gestión Institucional y Trámites en Costa Rica',
    template: '%s | Atlántica & Asociados',
  },
  description:
    '¿Le violaron sus derechos y no sabe qué hacer? Le ayudamos a redactar documentos y gestionar trámites ante la CCSS, municipalidades, ministerios y Sala Constitucional en Costa Rica.',
  keywords: [
    'asesoría en trámites Costa Rica',
    'redacción de documentos a instituciones',
    'qué hacer si me violan mis derechos',
    'cómo reclamar ante una institución pública',
    'recurso de amparo Costa Rica',
    'gestión listas de espera CCSS',
    'reclamo Municipalidad de Pococí',
    'trámites Casa Presidencial Costa Rica',
    'Atlántica y Asociados',
  ],
  authors: [{ name: 'Atlántica & Asociados' }],
  creator: 'Atlántica & Asociados',
  publisher: 'Atlántica & Asociados',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'es_CR',
    url: siteUrl,
    title: 'Atlántica & Asociados | ¿Le violaron sus derechos y no sabe qué hacer?',
    description:
      'Acompañamiento ciudadano y redacción técnica de documentos ante instituciones públicas en Costa Rica. 100% en línea y confidencial.',
    siteName: 'Atlántica & Asociados',
    images: [
      {
        url: '/assets/logo.jpg',
        width: 800,
        height: 800,
        alt: 'Logo oficial Atlántica & Asociados Costa Rica',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atlántica & Asociados | Gestión Institucional en Costa Rica',
    description:
      'Le ayudamos a dar el primer paso ante instituciones cuando sus derechos son vulnerados.',
    images: ['/assets/logo.jpg'],
  },
  icons: {
    icon: '/assets/logo.jpg',
    apple: '/assets/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Atlántica & Asociados',
    legalName: 'Atlántica & Asociados',
    url: siteUrl,
    logo: `${siteUrl}/assets/logo.jpg`,
    description:
      'Servicio en línea de asesoría ciudadana, redacción técnica y gestión de trámites institucionales en Costa Rica.',
    telephone: COMPANY.phoneDisplay,
    email: COMPANY.email,
    openingHours: 'Mo-Fr 07:00-17:00',
    areaServed: {
      '@type': 'Country',
      name: 'Costa Rica',
    },
    currenciesAccepted: 'CRC, USD',
    priceRange: '$$',
  };

  return (
    <html lang="es" className={`${plusJakartaSans.variable} ${cinzel.variable} scroll-smooth`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-slate-800 antialiased selection:bg-dorado/30 selection:text-azul-rey">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloatingButton />
      </body>
    </html>
  );
}
