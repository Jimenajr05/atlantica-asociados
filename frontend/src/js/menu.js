/**
 * Atlántica & Asociados - Control de Navegación y Menú Móvil (Estilo Rotúlers)
 */

export function initMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const line1 = document.getElementById('line1');
  const line2 = document.getElementById('line2');
  const line3 = document.getElementById('line3');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (!menuBtn || !mobileMenu) return;

  let isOpen = false;

  const toggleMenu = () => {
    isOpen = !isOpen;

    if (isOpen) {
      mobileMenu.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
      mobileMenu.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
      
      // Animación de icono hamburguesa a X
      if (line1) line1.style.transform = 'translateY(10px) rotate(45deg)';
      if (line2) line2.style.opacity = '0';
      if (line3) line3.style.transform = 'translateY(-10px) rotate(-45deg)';
      
      document.body.classList.add('overflow-hidden');
    } else {
      closeMenu();
    }
  };

  const closeMenu = () => {
    isOpen = false;
    mobileMenu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
    mobileMenu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');

    if (line1) line1.style.transform = 'none';
    if (line2) line2.style.opacity = '1';
    if (line3) line3.style.transform = 'none';

    document.body.classList.remove('overflow-hidden');
  };

  menuBtn.addEventListener('click', toggleMenu);

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Cerrar al presionar la tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeMenu();
    }
  });

  window.closeMobileMenu = closeMenu;
}
