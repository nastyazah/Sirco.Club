

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
            name: this.escapeHTML(review.name || 'Анонім'),
            rating: Math.min(5, Math.max(1, parseInt(review.rating) || 5)),
            review: this.escapeHTML(review.review || review.text || ''),
            photo: review.photo || 'img/user-ph.jpg'
        };
    },
    
    createStars(rating) {
        return Array(5).fill(0).map((_, i) => i < rating ? '★' : '☆').join('');
    },
    
    createTestimonialCard(review) {
        const sanitized = this.sanitizeReview(review);
        
        return `
            <article class="testimonial-card dynamic-review">
                <header class="testimonial-header">
                    <div class="testimonial-avatar">
                        <img src="${sanitized.photo}" 
                             alt="Фото ${sanitized.name}"
                             onerror="this.src='img/user1.jpg'"
                             loading="lazy">
                    </div>
                    <div class="testimonial-info">
                        <h4>${sanitized.name}</h4>
                        <div class="stars">${this.createStars(sanitized.rating)}</div>
                    </div>
                </header>
                <p class="testimonial-text">"${sanitized.review}"</p>
            </article>
        `;
    },
    
    async loadDynamicReviews() {
        try {
            console.log('🔄 Завантаження відгуків...');
            
            const track = document.getElementById('testimonialsTrack');
            
            if (!track) {
                console.error('❌ Елемент testimonialsTrack не знайдено');
                return;
            }
            
            // Зберігаємо статичні відгуки один раз
            if (!this.staticReviewsBackup) {
                const staticCards = track.querySelectorAll('.testimonial-card:not(.dynamic-review)');
                this.staticReviewsBackup = Array.from(staticCards).map(c => c.outerHTML).join('');
                console.log('📌 Збережено статичні відгуки');
            }
            
            // Перевірка кешу
            if (this.cache.reviews && this.cache.timestamp && 
                (Date.now() - this.cache.timestamp < this.cache.ttl)) {
                console.log('📦 Використання кешу');
                this.renderReviews(this.cache.reviews);
                return;
            }
            
            // Завантаження з API
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);
            
            const response = await fetch(this.API_URL, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            console.log('📥 Отримані дані:', data);
            
            if (!data.success) throw new Error(data.error || 'API помилка');
            
            const reviews = data.reviews || [];
            this.cache.reviews = reviews;
            this.cache.timestamp = Date.now();
            
            this.renderReviews(reviews);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('⏱️ Timeout');
            } else {
                console.error('❌ Помилка:', error);
            }
            this.renderReviews([]);
        }
    },
    
    renderReviews(dynamicReviews) {
        const track = document.getElementById('testimonialsTrack');
        if (!track) return;
        
        //  Зберігаємо стан анімації
        const wasAnimating = track.style.animationPlayState !== 'paused';
        
        let dynamicHTML = '';
        if (dynamicReviews.length > 0) {
            dynamicReviews.forEach(review => {
                dynamicHTML += this.createTestimonialCard(review);
            });
            console.log(`✅ Додано ${dynamicReviews.length} динамічних відгуків`);
        }
        
        // Комбінуємо
        const combinedHTML = this.staticReviewsBackup + dynamicHTML;
        
        // Дублюємо для безшовної прокрутки
        track.innerHTML = combinedHTML + combinedHTML;
        
        // Налаштовуємо швидкість
        this.adjustAnimationSpeed(track);
        
        // Відновлюємо стан анімації
        if (wasAnimating) {
            track.style.animationPlayState = 'running';
        }
        
        // Повторна ініціалізація обробників
        this.reinitializeTestimonials();
        
        const staticCount = (this.staticReviewsBackup.match(/<article/g) || []).length;
        const totalUnique = staticCount + dynamicReviews.length;
        
        console.log(`📊 Всього: ${staticCount} статичних + ${dynamicReviews.length} динамічних = ${totalUnique} унікальних`);
    },
    
    adjustAnimationSpeed(track) {
        const cards = track.querySelectorAll('.testimonial-card');
        const uniqueCards = cards.length / 2;
        
        // 5 секунд на картку
        const baseDuration = uniqueCards * 5;
        const duration = Math.max(30, Math.min(baseDuration, 120));
        
        track.style.animationDuration = `${duration}s`;
        console.log(`⏱️ Тривалість анімації: ${duration}s для ${uniqueCards} відгуків`);
    },
    
    reinitializeTestimonials() {
        const track = document.querySelector('.testimonials-track');
        if (!track) return;
        
        // ВИПРАВЛЕННЯ: Отримуємо свіжий список карток ПІСЛЯ оновлення DOM
        const cards = track.querySelectorAll('.testimonial-card');
        if (!cards || cards.length === 0) return;
        
        let isPaused = false;
        
        const togglePause = () => {
            isPaused = !isPaused;
            track.style.animationPlayState = isPaused ? 'paused' : 'running';
            track.classList.toggle('user-paused', isPaused);
        };
        
        // Додаємо обробники до НОВИХ елементів
        cards.forEach(card => {
            // ВАЖЛИВО: Створюємо нові обробники для кожної картки
            const clickHandler = (e) => {
                e.preventDefault();
                togglePause();
            };
            
            const mouseEnterHandler = () => {
                track.style.animationPlayState = 'paused';
            };
            
            const mouseLeaveHandler = () => {
                if (!isPaused) {
                    track.style.animationPlayState = 'running';
                }
            };
            
            // Видаляємо старі обробники якщо є
            card.removeEventListener('click', clickHandler);
            card.removeEventListener('mouseenter', mouseEnterHandler);
            card.removeEventListener('mouseleave', mouseLeaveHandler);
            
            // Додаємо нові
            card.addEventListener('click', clickHandler);
            card.addEventListener('mouseenter', mouseEnterHandler);
            card.addEventListener('mouseleave', mouseLeaveHandler);
        });
        
        console.log('🎯 Інтерактивність відгуків ініціалізована');
    },
    
    init() {
        console.log('🚀 ReviewsManager запущено');
        
        const loadReviews = () => {
            setTimeout(() => this.loadDynamicReviews(), 1000);
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadReviews);
        } else {
            loadReviews();
        }
        
        // Планове оновлення
        setInterval(() => {
            console.log('🔄 Планове оновлення...');
            this.loadDynamicReviews();
        }, 10 * 60 * 1000);
        
        // Оновлення при поверненні
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.cache.timestamp && 
                (Date.now() - this.cache.timestamp > this.cache.ttl)) {
                console.log('👁️ Вкладка активна, оновлюємо...');
                this.loadDynamicReviews();
            }
        });
        
        // Resize handler
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const track = document.querySelector('.testimonials-track');
                if (track) this.adjustAnimationSpeed(track);
            }, 250);
        });
    }
};

// Автоматичний запуск
if (typeof window !== 'undefined') {
    ReviewsManager.init();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReviewsManager;
}