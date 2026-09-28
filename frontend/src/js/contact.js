/**
 * Atlántica & Asociados - Formulario de Contacto & WhatsApp (Estilo Rotúlers)
 */

export function initContact() {
  // 1. Efecto Ripple en Botones (Rotúlers)
  document.querySelectorAll('.btn-ripple-container').forEach(button => {
    button.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const circle = document.createElement('span');
      const diameter = Math.max(rect.width, rect.height);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add('ripple');

      const existingRipple = this.querySelector('.ripple');
      if (existingRipple) {
        existingRipple.remove();
      }

      this.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });

  // 2. Copiar Teléfono al Portapapeles con Retroalimentación
  window.copyPhoneNumber = (phone, btn) => {
    navigator.clipboard.writeText(phone).then(() => {
      const original = btn.innerHTML;
      btn.innerHTML = `<span class="text-xs text-amber-300 font-semibold">¡Copiado!</span>`;
      setTimeout(() => {
        btn.innerHTML = original;
      }, 2000);
    }).catch(() => {
      alert(`Número de teléfono: ${phone}`);
    });
  };

  // 3. Envío Directo a WhatsApp desde Formulario
  window.submitToWhatsApp = () => {
    const name = document.getElementById('contact-name')?.value.trim();
    const phone = document.getElementById('contact-phone')?.value.trim();
    const email = document.getElementById('contact-email')?.value.trim();
    const profile = document.getElementById('contact-profile')?.value;
    const service = document.getElementById('contact-service')?.value;
    const message = document.getElementById('contact-message')?.value.trim();

    if (!name || !phone || !message) {
      alert('Por favor complete su Nombre, Teléfono y Detalle del caso antes de continuar.');
      return;
    }

    const waText = `*CONSULTA FORMAL - ATLÁNTICA & ASOCIADOS*\n\n` +
      `👤 *Nombre:* ${name}\n` +
      `📞 *Teléfono:* ${phone}\n` +
      `📧 *Correo:* ${email || 'No especificado'}\n` +
      `🏢 *Tipo de Solicitante:* ${profile}\n` +
      `⚖️ *Servicio de Interés:* ${service}\n` +
      `📝 *Detalle del Caso:*\n${message}\n\n` +
      `_Enviado desde el portal web oficial de Atlántica & Asociados._`;

    window.open(`https://wa.me/50660024545?text=${encodeURIComponent(waText)}`, '_blank');
  };

  // 4. Envío Formal y Apertura de Modal
  window.handleFormSubmit = (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name')?.value.trim();
    const phone = document.getElementById('contact-phone')?.value.trim();
    const message = document.getElementById('contact-message')?.value.trim();

    if (!name || !phone || !message) {
      alert('Por favor complete los campos obligatorios (*).');
      return;
    }

    const modal = document.getElementById('confirm-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    document.getElementById('main-contact-form')?.reset();
  };

  window.closeConfirmationModal = () => {
    const modal = document.getElementById('confirm-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };
}
