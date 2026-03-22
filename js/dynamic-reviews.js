const ReviewsManager = {
    API_URL: 'https://script.google.com/macros/s/AKfycbyYAUufFZGrtr2mvcRWCkCiiVWVdA4IEBuxxj35qPyuPk7F2mtUBYEqQo4wO5dr9FcL/exec',
    staticReviewsBackup: null,

    cache: {
        reviews: null,
        timestamp: null,
        ttl: 10 * 60 * 1000
    },

    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    sanitizeReview(review) {
        return {
            name:   this.escapeHTML(review.name   || 'Анонім'),
            rating: Math.min(5, Math.max(1, parseInt(review.rating) || 5)),
            review: this.escapeHTML(review.review || review.text || ''),
            photo:  review.photo || 'img/user-ph.jpg'
        };
    },

    createStars(rating) {
        return Array(5).fill(0).map(function(_, i) { return i < rating ? '★' : '☆'; }).join('');
    },

    createTestimonialCard(review) {
        const s = this.sanitizeReview(review);
        const stars = this.createStars(s.rating);
        return (
            '<article class="testimonial-card dynamic-review">' +
            '<header class="testimonial-header">' +
            '<div class="testimonial-avatar">' +
            '<img src="' + s.photo + '" alt="Фото ' + s.name + '" loading="lazy">' +
            '</div>' +
            '<div class="testimonial-info">' +
            '<h4>' + s.name + '</h4>' +
            '<div class="stars">' + stars + '</div>' +
            '</div>' +
            '</header>' +
            '<p class="testimonial-text">&ldquo;' + s.review + '&rdquo;</p>' +
            '</article>'
        );
    },

    async loadDynamicReviews() {
        const track = document.getElementById('testimonialsTrack');
        if (!track) return;

        if (!this.staticReviewsBackup) {
            const staticCards = track.querySelectorAll('.testimonial-card:not(.dynamic-review)');
            this.staticReviewsBackup = Array.from(staticCards).map(function(c) { return c.outerHTML; }).join('');
        }

        if (this.cache.reviews && this.cache.timestamp &&
            (Date.now() - this.cache.timestamp < this.cache.ttl)) {
            this.renderReviews(this.cache.reviews);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(function() { controller.abort(); }, 20000);

        let response;
        try {
            response = await fetch(this.API_URL, { method: 'GET', signal: controller.signal });
        } catch (fetchErr) {
            clearTimeout(timeoutId);
            console.warn('ReviewsManager fetch failed:', fetchErr);
            this.renderReviews([]);
            return;
        }
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn('ReviewsManager: HTTP ' + response.status);
            this.renderReviews([]);
            return;
        }

        let data;
        try {
            data = await response.json();
        } catch (parseErr) {
            console.warn('ReviewsManager parse error:', parseErr);
            this.renderReviews([]);
            return;
        }

        if (!data.success) {
            console.warn('ReviewsManager API error:', data.error || 'unknown');
            this.renderReviews([]);
            return;
        }

        const reviews = data.reviews || [];
        this.cache.reviews   = reviews;
        this.cache.timestamp = Date.now();
        this.renderReviews(reviews);
    },

    renderReviews(dynamicReviews) {
        const track = document.getElementById('testimonialsTrack');
        if (!track) return;

        let dynamicHTML = '';
        dynamicReviews.forEach(function(review) {
            dynamicHTML += ReviewsManager.createTestimonialCard(review);
        });

        const combined = this.staticReviewsBackup + dynamicHTML;

        /* Single reflow: pause → update DOM → recalc → restart */
        track.style.animation = 'none';
        track.innerHTML = combined + combined;
        void track.offsetWidth;
        this.applyAnimation(track);
        this.reinitialize(track);
    },

    applyAnimation(track) {
        const cards = track.querySelectorAll('.testimonial-card');
        const unique = Math.max(1, cards.length / 2);
        const duration = Math.max(30, Math.min(unique * 5, 120));
        track.style.animation = 'seamless-scroll ' + duration + 's linear infinite';
    },

    reinitialize(track) {
        if (!track) return;
        let isPaused = false;

        track.querySelectorAll('.testimonial-card').forEach(function(card) {
            card.addEventListener('click', function(e) {
                e.preventDefault();
                isPaused = !isPaused;
                track.style.animationPlayState = isPaused ? 'paused' : 'running';
                track.classList.toggle('user-paused', isPaused);
            });
            card.addEventListener('mouseenter', function() {
                track.style.animationPlayState = 'paused';
            });
            card.addEventListener('mouseleave', function() {
                if (!isPaused) { track.style.animationPlayState = 'running'; }
            });
        });
    },

    init() {
        const self = this;

        function load() {
            setTimeout(function() { void self.loadDynamicReviews(); }, 1000);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', load);
        } else {
            load();
        }

        setInterval(function() { void self.loadDynamicReviews(); }, 10 * 60 * 1000);

        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && self.cache.timestamp &&
                (Date.now() - self.cache.timestamp > self.cache.ttl)) {
                void self.loadDynamicReviews();
            }
        });

        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                const track = document.querySelector('.testimonials-track');
                if (track) { self.applyAnimation(track); }
            }, 250);
        });
    }
};

if (typeof window !== 'undefined') {
    ReviewsManager.init();
}