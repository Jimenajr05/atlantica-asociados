/**
 * Atlántica & Asociados - Master Orchestrator (Arquitectura Modular Rotúlers)
 */

import '../style.css';
import { initMenu } from './menu.js';
import { initAnimations } from './animations.js';
import { initServices } from './services.js';
import { initContact } from './contact.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar iconos modernos Lucide
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // 2. Control del Menú Móvil
  initMenu();

  // 3. Animaciones GSAP & ScrollTrigger
  initAnimations();

  // 4. Servicios & Buscador
  initServices();

  // 5. Formulario & Contacto
  initContact();

  // 6. Efecto de Scroll en Navbar (Rotúlers)
  const navbar = document.getElementById('navbar');
  const topbar = document.querySelector('aside');
  const topbarHeight = topbar ? topbar.offsetHeight : 33;
  if (navbar) {
    const onScroll = () => {
      if (window.scrollY > topbarHeight) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 7. Botón Volver Arriba
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 8. Año Actual en Copyright
  const yearEl = document.getElementById('copyright-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 9. Rastreador de Clics en WhatsApp (Rotúlers)
  document.body.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;

    if (a.href && (a.href.includes('wa.me') || a.href.includes('api.whatsapp.com'))) {
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'whatsapp_click', url: a.href });
      } catch (err) {}
    }
  });
});
