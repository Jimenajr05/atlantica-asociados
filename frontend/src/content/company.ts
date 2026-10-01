export interface CompanyInfo {
  name: string;
  tagline: string;
  motto: string;
  heroTitle: string;
  heroSubtitle: string;
  description: string;
  purpose: string;
  phone: string;
  phoneDisplay: string;
  secondaryPhone: string;
  secondaryPhoneDisplay: string;
  whatsappNumber: string;
  whatsappMessage: string;
  email: string;
  schedule: string;
  scheduleDetails: {
    days: string;
    hours: string;
    timeZone: string;
  };
  mision: string;
  vision: string;
  commitment: string;
  values: string[];
  billing: string;
  facebook: string;
  instagram: string;
  socialShortText: string;
  legalDisclaimer: string;
}

export const COMPANY: CompanyInfo = {
  name: "ATLÁNTICA & ASOCIADOS",
  tagline: "Le ayudamos a dar el primer paso",
  motto: "Transformamos su inquietud en respuestas claras y gestiones efectivas.",
  heroTitle: "¿Le violaron sus derechos y no sabe qué hacer?",
  heroSubtitle: "Le ayudamos a dar el primer paso. Le escuchamos con empatía y le guiamos paso a paso ante instituciones públicas y privadas en Costa Rica.",
  description: "En ATLÁNTICA & ASOCIADOS le brindamos acompañamiento humano, cercano y riguroso. Entendemos lo abrumador que puede ser enfrentar trámites ante la CCSS, municipalidades u otras instituciones. Estamos aquí para orientarle en lenguaje sencillo y defender sus derechos.",
  purpose: "Nuestro propósito es hacer accesible la gestión institucional para cualquier ciudadano, comunidad u organización, guiándole con claridad desde la primera consulta hasta la resolución de su caso.",
  phone: "50660024545",
  phoneDisplay: "6002-4545",
  secondaryPhone: "50684511030",
  secondaryPhoneDisplay: "8451-1030",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "50660024545",
  whatsappMessage: process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE || "Hola, necesito orientación sobre una situación o trámite institucional.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "infoatlantica.asociados@gmail.com",
  schedule: "Lunes a viernes de 7:00 a.m. a 5:00 p.m.",
  scheduleDetails: {
    days: "Lunes a viernes",
    hours: "7:00 a.m. a 5:00 p.m.",
    timeZone: "Hora de Costa Rica (GMT-6)",
  },
  mision: "Brindar orientación y acompañamiento a personas, comunidades y organizaciones con amabilidad, rigor y transparencia, facilitando soluciones claras ante instituciones cuando sus derechos hayan sido desatendidos.",
  vision: "Ser el servicio de asesoría y orientación ciudadana de mayor confianza en Costa Rica, reconocido por su calidez humana, accesibilidad y efectividad en la defensa de los derechos de las personas.",
  commitment: "Creemos que cada persona merece ser escuchada con respeto y recibir respuestas claras. No está solo: le acompañamos con experiencia y empatía en cada etapa del proceso.",
  values: [
    "Empatía y Cercanía",
    "Transparencia",
    "Responsabilidad",
    "Claridad",
    "Compromiso Humano",
    "Confidencialidad"
  ],
  billing: "Contamos con facturación electrónica autorizada para brindar nuestros servicios con total formalidad a personas particulares, asociaciones, comunidades y empresas.",
  facebook: "https://www.facebook.com/share/p/1DnBj4CX8s/",
  instagram: "https://www.instagram.com/atlanticaasociados/",
  socialShortText: "ATLÁNTICA & ASOCIADOS | Poder y Estrategia\nLe escuchamos y le guiamos paso a paso en sus trámites y reclamos institucionales en Costa Rica.\nTeléfonos de atención: 6002-4545 / 8451-1030",
  legalDisclaimer: "La información disponible en este sitio web tiene carácter orientativo y busca facilitar el entendimiento de trámites ciudadanos. Para gestiones judiciales formales, cada caso se evalúa de manera individualizada.",
};

export const WHATSAPP_URL = `https://wa.me/${COMPANY.whatsappNumber}?text=${encodeURIComponent(COMPANY.whatsappMessage)}`;

export function getWhatsAppCustomUrl(customMessage: string): string {
  return `https://wa.me/${COMPANY.whatsappNumber}?text=${encodeURIComponent(customMessage)}`;
}
