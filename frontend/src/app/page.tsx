import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageCircle,
  FileCheck2,
  ShieldCheck,
  Clock,
  ArrowRight,
  BookOpen,
  Building2,
  Hospital,
  Scale,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { COMPANY, WHATSAPP_URL } from '@/content/company';
import { SERVICES } from '@/content/services';
import { WORKFLOW_STEPS, StepCard } from '@/components/StepCard';
import { ServiceCard } from '@/components/ServiceCard';
import { FaqAccordion } from '@/components/FaqAccordion';
import { getPublicPosts } from '@/lib/posts-store';

export const revalidate = 30;

export default async function HomePage() {
  const featuredServices = SERVICES.slice(0, 3);
  const recentPosts = await getPublicPosts().then(posts => posts.slice(0, 3));

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 bg-white">
      {/* ========================================================================
          1. HERO SECTION - ASESORÍA Y REVISIÓN DE EXPEDIENTE (FOTO PROFESIONAL Y CÁLIDA)
          ======================================================================== */}
      <section className="relative min-h-[520px] lg:min-h-[580px] flex items-center justify-center border-b border-slate-200 overflow-hidden bg-slate-900 text-white">
        {/* Imagen de fondo (Asesora legal revisando expediente con balanza de justicia y gafas) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/hero_legal_bg.jpg"
            alt="Asesoría legal profesional sin caras mostrando documentos y balanza de justicia"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-55 transform scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/65 to-[#0b0f19]/35" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-7">
          {/* Logotipo distintivo idéntico a la imagen de referencia */}
          <div className="flex flex-col items-center justify-center text-center space-y-1 mb-2 select-none">
            <span className="font-serif text-2xl sm:text-4xl lg:text-5xl tracking-[0.22em] text-dorado font-bold uppercase drop-shadow-md">
              ATLÁNTICA
            </span>
            <div className="flex items-center justify-center gap-3 text-dorado/90 text-xs sm:text-sm tracking-[0.2em] font-serif uppercase my-1">
              <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-r from-transparent via-dorado/80 to-dorado"></span>
              <span className="font-medium">&amp; ASOCIADOS</span>
              <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-l from-transparent via-dorado/80 to-dorado"></span>
            </div>
            <div className="text-dorado text-xs my-0.5 animate-pulse">✦</div>
            <span className="text-[10px] sm:text-xs tracking-[0.3em] text-dorado font-semibold uppercase">
              PODER Y ESTRATEGIA
            </span>
          </div>

          {/* Título Principal de la landing */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] max-w-4xl mx-auto text-white">
            ¿Le violaron sus derechos y no sabe qué hacer?{' '}
            <span className="text-dorado block mt-2 font-bold">
              Le ayudamos a dar el primer paso
            </span>
          </h1>

          {/* Subtítulo humano, comprensivo */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
            Le escuchamos con empatía. Analizamos su situación, redactamos el documento o gestión que requiere y le explicamos cada paso en palabras sencillas, sin tecnicismos ni laberintos burocráticos.
          </p>

          {/* Botones de acción principales */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-7 py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Chatear por WhatsApp ({COMPANY.phoneDisplay})</span>
            </a>

            <Link
              href="/contacto"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-azul-rey hover:bg-azul-rey-dark text-white px-7 py-3.5 rounded-xl font-bold text-base shadow-md transition-all border border-azul-rey-dark/40"
            >
              <FileCheck2 className="w-5 h-5 text-dorado" />
              <span>Cuéntenos su caso</span>
            </Link>
          </div>

          {/* Garantías de atención */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 max-w-2xl mx-auto border-t border-white/10">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-dorado flex-shrink-0" />
              <span>Atención strictly confidencial</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-dorado flex-shrink-0" />
              <span>Lunes a viernes de 7:00 a.m. a 5:00 p.m.</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-dorado flex-shrink-0" />
              <span>Trámites 100% digitales sin traslados</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
          2. EMPATÍA: SITUACIONES COTIDIANAS EN COSTA RICA
          ======================================================================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-azul-rey bg-azul-rey/5 px-3 py-1 rounded-full inline-block">
              Identifique su situación
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-azul-rey">
              ¿Está pasando por alguna de estas dificultades?
            </h2>
            <p className="text-sm text-slate-600">
              Muchas personas acuden a nosotros desanimadas tras intentar resolver solas un trámite. Le ayudamos a ordenar su reclamo y hacerse escuchar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
            <div className="flex items-start gap-3.5 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-azul-rey/10 text-azul-rey flex items-center justify-center flex-shrink-0 mt-0.5">
                <Hospital className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Retraso excesivo en cirugía o cita médica (CCSS)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Lleva meses o años esperando fecha en un hospital público y su estado de salud o calidad de vida empeora cada día.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-azul-rey/10 text-azul-rey flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Falta de respuesta municipal o de ministerios
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Presentó una nota por problemas de caminos, alcantarillados, patentes o cobros y pasaron semanas sin recibir respuesta.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-azul-rey/10 text-azul-rey flex items-center justify-center flex-shrink-0 mt-0.5">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Violación al Derecho de Petición (Artículo 27)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Una entidad se niega a darle información oficial, copias de expediente o le responde de forma evasiva.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-azul-rey/10 text-azul-rey flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Reclamos por subsidios o beneficios sociales
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Le suspendieron o denegaron una ayuda o pensión sin una explicación clara y necesita apelar oportunamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
          3. VISTA PREVIA DE SERVICIOS
          ======================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-azul-rey bg-azul-rey/5 px-3 py-1 rounded-full inline-block mb-2">
              Gestiones Frecuentes
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-azul-rey">
              Nuestros Servicios de Acompañamiento
            </h2>
          </div>
          <Link
            href="/servicios"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-azul-rey hover:text-dorado-hover transition-colors"
          >
            <span>Ver todos los servicios de orientación</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* ========================================================================
          4. CÓMO FUNCIONA CON IMAGEN DE FONDO CÁLIDA (MUELLE Y MAR PACÍFICO)
          ======================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-white shadow-md">
          {/* Imagen de fondo suave */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/assets/sea_bg.jpg"
              alt="Muelle al amanecer en un mar tranquilo"
              fill
              sizes="100vw"
              className="object-cover object-center opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f19]/90 via-[#0b0f19]/80 to-[#0b0f19]" />
          </div>

          <div className="relative z-10 p-8 sm:p-12 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-dorado bg-white/10 px-3 py-1 rounded-full inline-block">
                Camino Claro y Transparente
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                ¿Cómo trabajamos juntos en su caso?
              </h2>
              <p className="text-sm sm:text-base text-slate-200">
                Un proceso sencillo de 4 pasos para guiarle desde la primera consulta hasta la entrega de sus escritos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {WORKFLOW_STEPS.map((step) => (
                <StepCard key={step.number} step={step} />
              ))}
            </div>

            <div className="text-center pt-2">
              <Link
                href="/como-funciona"
                className="inline-flex items-center gap-2 text-sm font-bold text-dorado hover:text-white transition-colors"
              >
                <span>Conozca los detalles de cada etapa del acompañamiento</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
          5. PREGUNTAS FRECUENTES
          ======================================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-azul-rey bg-azul-rey/5 px-3 py-1 rounded-full inline-block">
            Respuestas Claras
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-azul-rey">
            Preguntas Frecuentes de la Ciudadanía
          </h2>
          <p className="text-sm text-slate-600">
            Aclaramos sus dudas de forma honesta, comprensible y directa.
          </p>
        </div>

        <FaqAccordion limit={5} />

        <div className="text-center pt-2">
          <Link
            href="/preguntas-frecuentes"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-azul-rey hover:text-dorado-hover transition-colors"
          >
            <span>Ver todas las preguntas frecuentes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ========================================================================
          6. ÚLTIMOS ARTÍCULOS DEL BLOG
          ======================================================================== */}
      {recentPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-azul-rey bg-azul-rey/5 px-3 py-1 rounded-full inline-block mb-2">
                Guías Prácticas
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-azul-rey">
                Artículos de Orientación Ciudadana
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-azul-rey hover:text-dorado-hover transition-colors"
            >
              <span>Ver todos los artículos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-6 flex flex-col justify-between transition-all shadow-sm hover:shadow"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5">
                    <BookOpen className="w-3.5 h-3.5 text-azul-rey" />
                    <span>
                      {new Date(post.published_at || post.created_at).toLocaleDateString('es-CR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>{post.reading_time_minutes || 4} min lectura</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-azul-rey hover:text-dorado-hover transition-colors mb-2 leading-snug">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs font-bold text-azul-rey hover:text-dorado-hover flex items-center gap-1 transition-colors"
                  >
                    <span>Leer guía completa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================
          7. LLAMADO FINAL CERCANO Y ACOGEDOR
          ======================================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-azul-rey rounded-2xl p-8 sm:p-12 text-center text-white space-y-6 shadow-md border border-azul-rey-dark">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              ¿Desea consultarnos su situación hoy mismo?
            </h2>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              No enfrente la confusión a solas. Escríbanos con total confianza a nuestro WhatsApp y le diremos de forma clara cómo proceder.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Chatear al {COMPANY.phoneDisplay}</span>
            </a>
            <Link
              href="/contacto"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-colors"
            >
              <FileCheck2 className="w-4 h-4 text-dorado" />
              <span>Enviar caso por formulario</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
