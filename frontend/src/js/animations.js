/**
 * Atlántica & Asociados - Animaciones Interactivas con GSAP & ScrollTrigger (Estilo Rotúlers)
 */

export function initAnimations() {
  if (typeof gsap === 'undefined') return;

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // 1. Timeline de Entrada de la Sección Hero
  const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  if (document.getElementById('hero-badge')) {
    heroTl.fromTo('#hero-badge',
      { opacity: 0, y: -25 },
      { opacity: 1, y: 0, duration: 0.8 }
    );
  }

  if (document.getElementById('hero-title')) {
    heroTl.fromTo('#hero-title',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1 },
      '-=0.5'
    );
  }

  if (document.getElementById('hero-subtitle')) {
    heroTl.fromTo('#hero-subtitle',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.9 },
      '-=0.6'
    );
  }

  if (document.getElementById('hero-buttons')) {
    heroTl.fromTo('#hero-buttons',
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.5'
    );
  }

  if (document.getElementById('hero-card')) {
    heroTl.fromTo('#hero-card',
      { opacity: 0, scale: 0.92, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 1.1 },
      '-=0.7'
    );
  }

  // 2. ScrollTrigger en Secciones Principales
  if (typeof ScrollTrigger !== 'undefined') {
    // Tarjetas de servicios
    gsap.utils.toArray('.service-item-card').forEach((card, index) => {
      gsap.fromTo(card,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    // Valores
    gsap.utils.toArray('.value-item-card').forEach((card) => {
      gsap.fromTo(card,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    // Títulos de sección
    gsap.utils.toArray('.section-header-reveal').forEach((header) => {
      gsap.fromTo(header,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: header,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    });
  }
}
