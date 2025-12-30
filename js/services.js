const CONFIG = {
  paw: {
    steps: { min: 3, max: 4 },
    stepDist: { min: 40, max: 70 },
    interval: { min: 3000, max: 8000 },
    duration: 1800,
  },
  scrollOffset: 300,
  themes: { light: 'light', dark: 'dark' },
  logos: { light: 'img/light.png', dark: 'img/dark.png' },
  parallax: {
    hero: 0.5,
    sections: 0.3,
  },
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const rand = (min, max) => Math.random() * (max - min) + min;

const DOM = {
  html: document.documentElement,
  body: document.body,
  header: $('header'),
  themeToggle: $('#themeToggle'),
  logoImg: $('#logoImg'),
  logoFallback: $('#logoFallback'),
  menuToggle: $('#menuToggle'),
  mobileMenu: $('#mobileMenu'),
  menuOverlay: $('#menuOverlay'),
  closeMenuBtn: $('#closeMenuBtn'),
  scrollTopBtn: $('#scrollTop'),
  menuLinks: $$('.menu-links a'),
  faqItems: $$('.faq-item'),
  hero: $('.hero'),
  serviceCards: $$('.service-card'),
  infoCards: $$('.info-card'),
  sections: $$('section'),
};

function applyTheme(theme) {
  DOM.html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  if (!DOM.logoImg) return;
  
  const path = CONFIG.logos[theme];
  DOM.logoImg.src = path;
  DOM.logoImg.onerror = () => {
    DOM.logoImg.style.display = 'none';
    DOM.logoFallback?.style.setProperty('display', 'flex');
  };
  DOM.logoImg.onload = () => {
    DOM.logoImg.style.display = 'block';
    DOM.logoFallback?.style.setProperty('display', 'none');
  };
}

function initTheme() {
  if (!DOM.themeToggle) return;
  
  const savedTheme = localStorage.getItem('theme') || CONFIG.themes.light;
  applyTheme(savedTheme);
  
  DOM.themeToggle.addEventListener('click', () => {
    const current = DOM.html.getAttribute('data-theme');
    const next = current === CONFIG.themes.light ? CONFIG.themes.dark : CONFIG.themes.light;
    applyTheme(next);
    createRipple(DOM.themeToggle);
  });
}

function createRipple(element) {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    width: ${size}px;
    height: ${size}px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  `;
  
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

function toggleMenu(forceClose = false) {
  const active = forceClose ? false : DOM.mobileMenu?.classList.toggle('active');
  
  [DOM.mobileMenu, DOM.menuToggle, DOM.menuOverlay].forEach(el => {
    el?.classList.toggle('active', active);
  });
  
  DOM.menuToggle?.setAttribute('aria-expanded', active);
  DOM.menuOverlay?.setAttribute('aria-hidden', !active);
  DOM.body.style.overflow = active ? 'hidden' : '';
}

function initMenu() {
  DOM.menuToggle?.addEventListener('click', () => toggleMenu());
  DOM.closeMenuBtn?.addEventListener('click', () => toggleMenu(true));
  DOM.menuOverlay?.addEventListener('click', () => toggleMenu(true));
  DOM.menuLinks.forEach(link => link.addEventListener('click', () => toggleMenu(true)));
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.mobileMenu?.classList.contains('active')) {
      toggleMenu(true);
    }
  });
}

function initFAQ() {
  document.addEventListener('click', e => {
    const question = e.target.closest('.faq-question');
    if (!question) return;
    
    const item = question.parentElement;
    const wasOpen = item.classList.contains('active');
    
    DOM.faqItems.forEach(i => {
      i.classList.remove('active');
      const answer = i.querySelector('.faq-answer');
      if (answer) answer.style.maxHeight = null;
    });
    
    if (!wasOpen) {
      item.classList.add('active');
      const answer = item.querySelector('.faq-answer');
      if (answer) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    }
  });
  
  DOM.faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    
    question.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
      }
    });
  });
}

let lastScrollY = window.pageYOffset;
let ticking = false;

function initScrollTop() {
  if (!DOM.scrollTopBtn) return;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  });
  
  DOM.scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function handleScroll() {
  const currentScrollY = window.pageYOffset;
  
  DOM.scrollTopBtn?.classList.toggle('visible', currentScrollY > CONFIG.scrollOffset);

  if (DOM.header) {
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      DOM.header.classList.add('header-hidden');
    } else {
      DOM.header.classList.remove('header-hidden');
    }
    
    DOM.header.classList.toggle('header-elevated', currentScrollY > 50);
  }
  
  lastScrollY = currentScrollY;
  
  handleParallax();
  handleScrollReveal();
}

function handleParallax() {
  const scrollY = window.pageYOffset;

  if (DOM.hero) {
    const heroOffset = scrollY * CONFIG.parallax.hero;
    DOM.hero.style.transform = `translateY(${heroOffset}px)`;
    
    const heroBefore = DOM.hero.querySelector('::before');
    if (heroBefore) {
      DOM.hero.style.setProperty('--parallax-offset', `${heroOffset * 0.3}px`);
    }
  }
}

function handleScrollReveal() {
  const elements = $$('.service-card, .info-card, .faq-item, .section-title');
  
  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
    
    if (isVisible && !el.classList.contains('revealed')) {
      el.classList.add('scroll-reveal', 'revealed');
    }
  });
}

function init3DTilt() {
  DOM.infoCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;
      
      card.style.transform = `
        perspective(800px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        translateY(-10px) 
        scale(1.02)
      `;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

function initMagneticButtons() {
  const buttons = $('.btn-book, .btn-large');
  
  buttons.forEach(button => {
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const moveX = x * 0.3;
      const moveY = y * 0.3;
      
      button.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
    });
  });
}

const PAW_SVG = `
<svg viewBox="0 0 100 100">
  <ellipse cx="50" cy="70" rx="20" ry="15"/>
  <ellipse cx="28" cy="45" rx="10" ry="13" transform="rotate(-15 28 45)"/>
  <ellipse cx="40" cy="35" rx="10" ry="13" transform="rotate(-5 40 35)"/>
  <ellipse cx="60" cy="35" rx="10" ry="13" transform="rotate(5 60 35)"/>
  <ellipse cx="72" cy="45" rx="10" ry="13" transform="rotate(15 72 45)"/>
</svg>`;

function createPawPrint() {
  const steps = Math.round(rand(CONFIG.paw.steps.min, CONFIG.paw.steps.max));
  const angle = rand(0, 360) * Math.PI / 180;
  const stepDist = rand(CONFIG.paw.stepDist.min, CONFIG.paw.stepDist.max);
  const duration = CONFIG.paw.duration;

  let x = rand(5, 95);
  let y = rand(5, 95);
  let side = Math.random() < 0.5 ? 'left' : 'right';

  for (let i = 0; i < steps; i++) {
    setTimeout(() => {
      const paw = document.createElement('div');
      paw.className = `paw-print ${side}`;
      paw.innerHTML = PAW_SVG;
      paw.style.cssText = `left: ${x}%; top: ${y}%; animation: pawFade ${duration}ms ease-out forwards`;
      
      paw.addEventListener('animationend', () => paw.remove(), { once: true });
      DOM.body.appendChild(paw);

      x += (Math.cos(angle) * stepDist) / window.innerWidth * 100;
      y += (Math.sin(angle) * stepDist) / window.innerHeight * 100;
      
      // Keep within bounds
      x = Math.max(5, Math.min(95, x));
      y = Math.max(5, Math.min(95, y));
      
      side = side === 'left' ? 'right' : 'left';
    }, i * (duration * 0.4));
  }
}

function initPawPrints() {
  setTimeout(createPawPrint, 800);
  
  const scheduleNext = () => {
    const delay = rand(CONFIG.paw.interval.min, CONFIG.paw.interval.max);
    setTimeout(() => {
      createPawPrint();
      scheduleNext();
    }, delay);
  };
  
  scheduleNext();
}

function initCursorEffect() {
  if (window.innerWidth < 768) return; // Skip on mobile
  
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.style.cssText = `
    position: fixed;
    width: 20px;
    height: 20px;
    border: 2px solid var(--accent);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    transition: transform 0.2s ease, opacity 0.2s ease;
    opacity: 0;
  `;
  DOM.body.appendChild(cursor);
  
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.opacity = '1';
  });
  
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });
  
  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;
    
    cursor.style.transform = `translate(${cursorX - 10}px, ${cursorY - 10}px)`;
    requestAnimationFrame(animateCursor);
  }
  
  animateCursor();
  
  // Expand cursor on interactive elements
  const interactiveElements = $$('a, button, .service-card, .info-card');
  
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = `translate(${cursorX - 15}px, ${cursorY - 15}px) scale(1.5)`;
      cursor.style.borderColor = 'var(--accent-bold)';
    });
    
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = `translate(${cursorX - 10}px, ${cursorY - 10}px) scale(1)`;
      cursor.style.borderColor = 'var(--accent)';
    });
  });
}

function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = $(href);
      
      if (target) {
        const offsetTop = target.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
}

function preloadImages() {
  const images = ['img/light.png', 'img/dark.png'];
  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.innerWidth >= 768) {
      init3DTilt();
    }
  }, 250);
});

function injectAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple-animation {
      to {
        transform: translate(-50%, -50%) scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

function init() {
  injectAnimations();
  preloadImages();
  initTheme();
  initMenu();
  initFAQ();
  initScrollTop();
  initPawPrints();
  init3DTilt();
  initMagneticButtons();
  initCursorEffect();
  initSmoothScroll();
  handleScrollReveal(); 
  
  setTimeout(() => {
    DOM.body.classList.add('loaded');
  }, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


