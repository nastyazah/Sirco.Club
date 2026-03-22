const App = {
    state: {
        theme: 'light',
        currentGalleryPage: 0,
        imagesPerPage: 8,
        currentLightboxIndex: 0,
        isMenuOpen: false,
    },

    constants: {
        GALLERY_IMAGES_COUNT: 27,
        MOBILE_BREAKPOINT: 768,
        TABLET_BREAKPOINT: 1024,
        THEME_STORAGE_KEY: 'sirko-theme',
    },

    init() {
        this.loadTheme();
        this.initProgressBar();
        this.initThemeToggle();
        this.initMobileMenu();
        this.initGallery();
        this.initLightbox();
        this.initScrollTop();
        this.initRevealAnimations();
        this.initKeyboardNav();
        this.initVisibilityOptimizations();
        this.hideLoading();
    },

    /* ---- Theme ---- */
    loadTheme() {
        try {
            const saved = localStorage.getItem(this.constants.THEME_STORAGE_KEY);
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.state.theme = saved || (prefersDark ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', this.state.theme);
            this.updateLogos(this.state.theme);

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem(this.constants.THEME_STORAGE_KEY)) {
                    this.state.theme = e.matches ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', this.state.theme);
                    this.updateLogos(this.state.theme);
                }
            });
        } catch {
            this.state.theme = 'light';
            document.documentElement.setAttribute('data-theme', 'light');
        }
    },

    updateLogos(theme) {
        const logoImg      = document.getElementById('logoImg');
        const logoFallback = document.getElementById('logoFallback');
        if (!logoImg || !logoFallback) return;
        logoImg.src = theme === 'dark' ? 'img/logo/dark.png' : 'img/logo/light.png';
        logoImg.onerror = () => {
            logoImg.style.display = 'none';
            logoFallback.style.display = 'flex';
        };
        logoImg.onload = () => {
            logoImg.style.display = 'block';
            logoFallback.style.display = 'none';
        };
    },

    initThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        toggle.addEventListener('click', () => {
            this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
            try { localStorage.setItem(this.constants.THEME_STORAGE_KEY, this.state.theme); } catch {}
            document.documentElement.setAttribute('data-theme', this.state.theme);
            this.updateLogos(this.state.theme);
        });
    },

    /* ---- Progress Bar ---- */
    initProgressBar() {
        let ticking = false;
        const bar = document.getElementById('progressBar');
        if (!bar) return;

        const update = () => {
            const scrolled = document.documentElement.scrollTop;
            const total    = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            bar.style.width = total > 0 ? `${(scrolled / total) * 100}%` : '0%';
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) { requestAnimationFrame(update); ticking = true; }
        }, { passive: true });
    },

    /* ---- Mobile Menu ---- */
    initMobileMenu() {
        const menuToggle  = document.getElementById('menuToggle');
        const mobileMenu  = document.getElementById('mobileMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        const closeBtn    = document.getElementById('closeMenuBtn');
        if (!menuToggle || !mobileMenu || !menuOverlay) return;

        const open = () => {
            this.state.isMenuOpen = true;
            mobileMenu.classList.add('active');
            menuToggle.classList.add('active');
            menuOverlay.classList.add('active');
            menuToggle.setAttribute('aria-expanded', 'true');
            menuOverlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        };

        const close = () => {
            if (!this.state.isMenuOpen) return;
            this.state.isMenuOpen = false;
            mobileMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            menuOverlay.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        };

        menuToggle.addEventListener('click', () => this.state.isMenuOpen ? close() : open());
        menuOverlay.addEventListener('click', close);
        if (closeBtn) closeBtn.addEventListener('click', close);
        document.querySelectorAll('.menu-links a').forEach(a => a.addEventListener('click', close));
    },

    /* ---- Gallery ---- */
    initGallery() {
        this.state.imagesPerPage = this.getImagesPerPage();
        this.renderGallery();

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const perPage = this.getImagesPerPage();
                if (perPage !== this.state.imagesPerPage) {
                    this.state.imagesPerPage = perPage;
                    this.state.currentGalleryPage = 0;
                    this.renderGallery();
                }
            }, 250);
        });

        document.getElementById('prevBtn')?.addEventListener('click', () => {
            if (this.state.currentGalleryPage > 0) {
                this.state.currentGalleryPage--;
                this.renderGallery();
            }
        });

        document.getElementById('nextBtn')?.addEventListener('click', () => {
            if (this.state.currentGalleryPage < this.getTotalPages() - 1) {
                this.state.currentGalleryPage++;
                this.renderGallery();
            }
        });
    },

    getImagesPerPage() {
        const w = window.innerWidth;
        if (w < this.constants.MOBILE_BREAKPOINT) return 4;
        if (w < this.constants.TABLET_BREAKPOINT) return 6;
        return 8;
    },

    getTotalPages() {
        return Math.ceil(this.constants.GALLERY_IMAGES_COUNT / this.state.imagesPerPage);
    },

    renderGallery() {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;

        const start = this.state.currentGalleryPage * this.state.imagesPerPage;
        const end   = Math.min(start + this.state.imagesPerPage, this.constants.GALLERY_IMAGES_COUNT);

        grid.innerHTML = Array.from({ length: end - start }, (_, i) => {
            const idx = start + i;
            return `
        <div class="gallery-item" role="listitem" data-index="${idx}">
          <img
            src="img/img${idx + 1}.jpg"
            alt="SIRKO CLUB фото ${idx + 1}"
            loading="lazy"
          >
        </div>
      `;
        }).join('');

        grid.querySelectorAll('.gallery-item img').forEach((img, i) => {
            const idx = start + i;
            img.onerror = () => {
                img.onerror = null;
                img.src = 'https://images.unsplash.com/photo-' + (1548199973030 + idx * 100000) + '?w=400&h=400&fit=crop&q=80';
            };
        });

        grid.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openLightbox(Number(item.dataset.index));
            });
        });

        this.updateGalleryButtons();
        this.preloadNext();
    },

    preloadNext() {
        const nextPage = this.state.currentGalleryPage + 1;
        if (nextPage >= this.getTotalPages()) return;
        const start = nextPage * this.state.imagesPerPage;
        const end   = Math.min(start + this.state.imagesPerPage, this.constants.GALLERY_IMAGES_COUNT);
        for (let i = start; i < end; i++) {
            const img = new Image();
            img.src = `img/img${i + 1}.jpg`;
        }
    },

    updateGalleryButtons() {
        const total  = this.getTotalPages();
        const prev   = document.getElementById('prevBtn');
        const next   = document.getElementById('nextBtn');
        if (prev) prev.disabled = this.state.currentGalleryPage === 0;
        if (next) next.disabled = this.state.currentGalleryPage >= total - 1;
    },

    /* ---- Lightbox ---- */
    initLightbox() {
        const lb      = document.getElementById('lightbox');
        if (!lb) return;

        lb.querySelector('.lightbox-close')?.addEventListener('click', () => this.closeLightbox());
        lb.querySelector('.lightbox-prev')?.addEventListener('click', () => this.lightboxStep(-1));
        lb.querySelector('.lightbox-next')?.addEventListener('click', () => this.lightboxStep(1));
        lb.addEventListener('click', (e) => { if (e.target === lb) this.closeLightbox(); });

        /* Swipe */
        let startX = 0;
        lb.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend',   (e) => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) this.lightboxStep(diff > 0 ? 1 : -1);
        }, { passive: true });
    },

    openLightbox(index) {
        const lb = document.getElementById('lightbox');
        if (!lb) return;
        this.state.currentLightboxIndex = index;
        this._updateLightboxUI();
        lb.classList.add('active');
        lb.setAttribute('aria-hidden', 'false');
        // Scroll lock — store position, freeze body without shifting layout
        const scrollY = window.scrollY;
        document.body.dataset.scrollY = String(scrollY);
        document.body.style.overflow = 'hidden';
    },

    closeLightbox() {
        const lb = document.getElementById('lightbox');
        if (!lb) return;
        lb.classList.remove('active');
        lb.setAttribute('aria-hidden', 'true');
        // Restore scroll
        document.body.style.overflow = '';
        const scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
        window.scrollTo(0, scrollY);
    },

    lightboxStep(dir) {
        const total = this.constants.GALLERY_IMAGES_COUNT;
        this.state.currentLightboxIndex = (this.state.currentLightboxIndex + dir + total) % total;
        this._updateLightboxUI();
    },

    _updateLightboxUI() {
        const img     = document.getElementById('lightboxImg');
        const counter = document.getElementById('lightboxCounter');
        if (!img) return;
        const idx = this.state.currentLightboxIndex;
        img.src = `img/img${idx + 1}.jpg`;
        img.alt = `SIRKO CLUB фото ${idx + 1}`;
        img.style.animation = 'none';
        void img.offsetWidth;
        img.style.animation = 'zoomIn 0.28s cubic-bezier(0.22,1,0.36,1) both';
        if (counter) counter.textContent = `${idx + 1} / ${this.constants.GALLERY_IMAGES_COUNT}`;
    },

    /* ---- Reveal on Scroll ---- */
    initRevealAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        /* Mark services grid and info grid for stagger */
        document.querySelectorAll('.services-grid, .info-grid').forEach(el => {
            el.classList.add('reveal-stagger');
            observer.observe(el);
        });

        /* Generic sections */
        document.querySelectorAll('.section-title, .cta-section, .info-section, .map-section').forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    },

    /* ---- Keyboard Nav ---- */
    initKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state.isMenuOpen) {
                    document.getElementById('closeMenuBtn')?.click();
                }
                const lbEsc = document.getElementById('lightbox');
                if (lbEsc && lbEsc.classList.contains('active')) this.closeLightbox();
            }
            const lbKey = document.getElementById('lightbox');
            if (lbKey && lbKey.classList.contains('active')) {
                if (e.key === 'ArrowLeft')  this.lightboxStep(-1);
                if (e.key === 'ArrowRight') this.lightboxStep(1);
            }
        });
    },

    /* ---- Scroll Top ---- */
    initScrollTop() {
        const btn = document.getElementById('scrollTop');
        if (!btn) return;
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    btn.classList.toggle('visible', window.scrollY > 300);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    },

    /* ---- Visibility (pause animations) ---- */
    initVisibilityOptimizations() {
        const container = document.querySelector('.testimonials-container');
        const track     = document.querySelector('.testimonials-track');
        if (!container || !track) return;

        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                track.style.animationPlayState = e.isIntersecting ? 'running' : 'paused';
            });
        }, { threshold: 0 });
        io.observe(container);
    },

    /* ---- Loading Screen ---- */
    hideLoading() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const loading = document.getElementById('loading');
                if (loading) loading.classList.add('hidden');
            }, 400);
        });
    },
};

/* ---- Bootstrap ---- */
document.addEventListener('DOMContentLoaded', () => App.init());

/* ---- Global image fallback ---- */
window.addEventListener('error', (e) => {
    const target = e.target;
    if (target && target.tagName === 'IMG' && target.dataset.fallbackApplied !== '1') {
        target.dataset.fallbackApplied = '1';
        const svgParts = [
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">',
            '<rect fill="#e8e0d8" width="400" height="300"/>',
            '<text fill="#a0907f" x="50%" y="50%" dominant-baseline="middle"',
            ' text-anchor="middle" font-family="sans-serif" font-size="16">',
            'Фото недоступне</text></svg>'
        ];
        target.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgParts.join(''));
    }
}, true);