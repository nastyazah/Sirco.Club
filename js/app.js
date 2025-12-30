document.addEventListener('DOMContentLoaded', () => {
  // Dark mode toggle
  const toggle = document.getElementById('theme-toggle');
  const icon   = document.getElementById('theme-icon');
  const body   = document.body;
  const saved  = localStorage.getItem('theme');
  if (saved === 'dark') {
    body.classList.add('dark-mode');
    icon.textContent = 'light_mode';
  }
  toggle.addEventListener('click', () => {
    const isDark = body.classList.toggle('dark-mode');
    icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // Статистика
  document.getElementById('stat-today-bookings').textContent = 8;

  // Перемикання секцій із skeleton & fade-in
  const tabs = {
    'btn-dashboard-nav':  'dashboard',
    'btn-expense-form':   'expense-form',
    'btn-expense-nav':    'expense-form',
    'btn-reports':        'reports',
    'btn-reports-nav':    'reports',
    'btn-client-map':     'client-map',
    'btn-client-map-nav': 'client-map'
  };
  Object.entries(tabs).forEach(([btnId, secId]) => {
    const btn     = document.getElementById(btnId);
    const section = document.getElementById(secId);
    if (!btn || !section) return;
    btn.addEventListener('click', () => {
      Object.values(tabs).forEach(id => {
        const s = document.getElementById(id);
        s.classList.add('hidden');
        s.classList.remove('show');
      });
      if (secId === 'dashboard') {
        section.classList.remove('hidden');
        section.classList.add('show');
        return;
      }
      const skeleton = section.querySelector('.skeleton-wrapper');
      const content  = section.querySelector('.section-content');
      skeleton.classList.remove('hidden');
      content.classList.add('hidden');
      section.classList.remove('hidden');
      setTimeout(() => {
        skeleton.classList.add('hidden');
        content.classList.remove('hidden');
        section.classList.add('show');
      }, 800);
    });
  });

  // Burger + swipe
  const burger  = document.getElementById('burger-btn');
  const sidebar = document.getElementById('sidebar');
  burger.addEventListener('click', () => sidebar.classList.toggle('active'));
  let startX = 0;
  sidebar.addEventListener('touchstart', e => startX = e.touches[0].clientX);
  sidebar.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientX - startX < -50) sidebar.classList.remove('active');
  });

  // Хаотичні лапки
  if (window.innerWidth <= 768) {
    const zone = document.querySelector('.paw-zone');
    zone.querySelectorAll('.paw').forEach((paw, i) => {
      function animatePaw() {
        const w = zone.clientWidth - paw.clientWidth;
        const h = zone.clientHeight - paw.clientHeight;
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = (Math.random() * 60) - 30;
        paw.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
        paw.style.opacity   = '1';
        const stay = 800 + Math.random() * 1200;
        setTimeout(() => {
          paw.style.opacity = '0';
          setTimeout(animatePaw, 500 + Math.random() * 2000);
        }, stay);
      }
      setTimeout(animatePaw, i * 300 + Math.random() * 500);
    });
  }
});
