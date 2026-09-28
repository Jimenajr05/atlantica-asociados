/**
 * Atlántica & Asociados - Catálogo de Servicios & Orientador de Gestión (Estilo Rotúlers)
 */

export function initServices() {
  const searchInput = document.getElementById('service-search');
  const clearBtn = document.getElementById('clear-search-btn');
  const filterBtns = document.querySelectorAll('.service-filter-btn');
  const serviceCards = document.querySelectorAll('.service-item-card');
  const noResultsEl = document.getElementById('services-no-results');

  let activeCategory = 'all';
  let searchTerm = '';

  const applyFilters = () => {
    let count = 0;
    const query = searchTerm.trim().toLowerCase();

    serviceCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const title = card.querySelector('.service-title').textContent.toLowerCase();
      const desc = card.querySelector('.service-desc').textContent.toLowerCase();
      const tag = card.querySelector('.service-tag')?.textContent.toLowerCase() || '';

      const matchCategory = (activeCategory === 'all') || (category === activeCategory);
      const matchSearch = !query || title.includes(query) || desc.includes(query) || tag.includes(query);

      if (matchCategory && matchSearch) {
        card.classList.remove('hidden');
        card.classList.add('flex');
        count++;
      } else {
        card.classList.add('hidden');
        card.classList.remove('flex');
      }
    });

    if (noResultsEl) {
      if (count === 0) {
        noResultsEl.classList.remove('hidden');
      } else {
        noResultsEl.classList.add('hidden');
      }
    }
  };

  // Botones de filtro de categoría
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active', 'bg-gold-primary', 'text-black', 'border-gold-primary');
        b.classList.add('bg-slate-900/80', 'text-gray-300', 'border-white/10');
      });

      btn.classList.add('active', 'bg-gold-primary', 'text-black', 'border-gold-primary');
      btn.classList.remove('bg-slate-900/80', 'text-gray-300', 'border-white/10');

      activeCategory = btn.getAttribute('data-filter');
      applyFilters();
    });
  });

  // Búsqueda en vivo
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      if (clearBtn) {
        clearBtn.classList.toggle('hidden', !searchTerm);
      }
      applyFilters();
    });
  }

  // Limpiar búsqueda
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchTerm = '';
      clearBtn.classList.add('hidden');
      applyFilters();
      searchInput.focus();
    });
  }

  // Reiniciar filtros
  window.resetAllServiceFilters = () => {
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    searchTerm = '';
    activeCategory = 'all';

    filterBtns.forEach(b => {
      if (b.getAttribute('data-filter') === 'all') {
        b.classList.add('active', 'bg-gold-primary', 'text-black', 'border-gold-primary');
        b.classList.remove('bg-slate-900/80', 'text-gray-300', 'border-white/10');
      } else {
        b.classList.remove('active', 'bg-gold-primary', 'text-black', 'border-gold-primary');
        b.classList.add('bg-slate-900/80', 'text-gray-300', 'border-white/10');
      }
    });

    serviceCards.forEach(c => {
      c.classList.remove('hidden');
      c.classList.add('flex');
    });

    if (noResultsEl) noResultsEl.classList.add('hidden');
  };

  window.filterServicesFromCategory = (cat) => {
    const target = document.querySelector(`.service-filter-btn[data-filter="${cat}"]`);
    if (target) {
      target.click();
      const el = document.getElementById('servicios');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Función para seleccionar servicio desde una tarjeta
  window.selectServiceForInquiry = (serviceTitle) => {
    const serviceInput = document.getElementById('contact-service');
    const messageInput = document.getElementById('contact-message');
    const contactSection = document.getElementById('contacto');

    if (serviceInput) {
      for (let i = 0; i < serviceInput.options.length; i++) {
        if (serviceInput.options[i].text.includes(serviceTitle) || serviceTitle.includes(serviceInput.options[i].value)) {
          serviceInput.selectedIndex = i;
          break;
        }
      }
    }

    if (messageInput && !messageInput.value) {
      messageInput.value = `Hola, solicito asesoría y gestión formal para el trámite: "${serviceTitle}".`;
    }

    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ==========================================================================
  // Orientador de Gestión (Wizard Interactivo en 3 Pasos)
  // ==========================================================================
  const wizard = {
    profile: 'Persona Individual',
    need: 'Trámites o Solicitudes ante Instituciones',
    urgency: 'Alta Urgencia con Plazo Legal'
  };

  window.setWizardValue = (key, value, element) => {
    wizard[key] = value;
    const parent = element.closest('.wizard-step');
    if (parent) {
      parent.querySelectorAll('.wizard-card-option').forEach(el => {
        el.classList.remove('border-gold-primary', 'bg-amber-400/10');
        el.classList.add('border-white/10', 'bg-slate-900/60');
      });
      element.classList.add('border-gold-primary', 'bg-amber-400/10');
      element.classList.remove('border-white/10', 'bg-slate-900/60');
    }
  };

  window.navigateWizard = (step) => {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`wizard-step-${step}`);
    if (target) target.classList.remove('hidden');

    const progress = document.getElementById('wizard-progress-bar');
    const stepLabel = document.getElementById('wizard-step-label');

    const percentages = { 1: '33%', 2: '66%', 3: '100%' };
    const labels = {
      1: 'Paso 1 de 3: Perfil del Solicitante',
      2: 'Paso 2 de 3: Objetivo de su Gestión',
      3: 'Paso 3 de 3: Nivel de Prioridad'
    };

    if (progress) progress.style.width = percentages[step] || '33%';
    if (stepLabel) stepLabel.textContent = labels[step] || '';
  };

  window.finishWizard = () => {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.add('hidden'));
    const result = document.getElementById('wizard-step-result');
    if (result) result.classList.remove('hidden');

    const progress = document.getElementById('wizard-progress-bar');
    if (progress) progress.style.width = '100%';

    const stepLabel = document.getElementById('wizard-step-label');
    if (stepLabel) stepLabel.textContent = 'Diagnóstico Completado';

    const summary = document.getElementById('wizard-result-summary');
    const recText = document.getElementById('wizard-result-rec');
    const waLink = document.getElementById('wizard-result-wa');

    if (summary) {
      summary.textContent = `Perfil: ${wizard.profile} • Objetivo: ${wizard.need} • Prioridad: ${wizard.urgency}`;
    }

    let recommendation = '';
    if (wizard.need.includes('Trámites')) {
      recommendation = `Para ${wizard.profile}, recomendamos una estructuración rigurosa de la solicitud formal con sustento técnico y legal para evitar inadmisibilidad o prevenciones, complementado con el respectivo cómputo formal de plazos legales.`;
    } else if (wizard.need.includes('Información')) {
      recommendation = `Las peticiones de acceso a información pública tienen amparo constitucional. Redactamos la solicitud formal con apercibimiento legal para que la administración entregue expedientes, cuentas y acuerdos sin demora.`;
    } else if (wizard.need.includes('Derechos')) {
      recommendation = `Ante silencios administrativos o actos lesivos, preparamos la fundamentación probatoria y la cronología fáctica para interponer recursos de amparo ante la Sala Constitucional o recursos de apelación en sede administrativa.`;
    } else {
      recommendation = `Para iniciativas comunales u organizaciones, formulamos el perfil técnico formal, justificamos el impacto territorial y facilitamos los acercamientos estratégicos con ministerios y municipalidades.`;
    }

    if (recText) recText.textContent = recommendation;

    if (waLink) {
      const text = `Hola Atlántica & Asociados, he generado mi diagnóstico en el portal web:\n- Perfil: ${wizard.profile}\n- Trámite: ${wizard.need}\n- Prioridad: ${wizard.urgency}\n\nSolicito una valoración formal de mi caso.`;
      waLink.href = `https://wa.me/50660024545?text=${encodeURIComponent(text)}`;
    }
  };
}
