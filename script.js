// ========================================
// XANOV.CLOUD — Scripts
// ========================================

document.addEventListener('DOMContentLoaded', () => {

    // --- HEADER SCROLL ---
    const header = document.getElementById('header');
    const onScroll = () => {
        header.classList.toggle('header--scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // --- BURGER & MOBILE MENU ---
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');

    burger.addEventListener('click', () => {
        burger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // --- ANIMATE ON SCROLL ---
    const animatedEls = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, +delay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    animatedEls.forEach(el => observer.observe(el));

    // --- COUNTER ANIMATION ---
    const counters = document.querySelectorAll('[data-count]');
    let countersDone = false;

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersDone) {
                countersDone = true;
                counters.forEach(counter => animateCounter(counter));
                counterObserver.disconnect();
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));

    function animateCounter(el) {
        const target = +el.dataset.count;
        const duration = 1500;
        const start = performance.now();

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            el.textContent = Math.round(target * eased);
            if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    // --- SMOOTH SCROLL ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const id = anchor.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // --- REVIEWS SLIDER ---
    const reviewsGrid = document.getElementById('reviewsGrid');
    const reviewPrev = document.getElementById('reviewPrev');
    const reviewNext = document.getElementById('reviewNext');

    if (reviewsGrid && reviewPrev && reviewNext) {
        reviewPrev.addEventListener('click', () => {
            reviewsGrid.scrollBy({ left: -380, behavior: 'smooth' });
        });
        reviewNext.addEventListener('click', () => {
            reviewsGrid.scrollBy({ left: 380, behavior: 'smooth' });
        });
    }

    // --- REVIEW STARS ---
    const starsContainer = document.getElementById('reviewStars');
    let selectedRating = 5;

    if (starsContainer) {
        const stars = starsContainer.querySelectorAll('span');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = +star.dataset.star;
                stars.forEach(s => {
                    s.classList.toggle('active', +s.dataset.star <= selectedRating);
                });
            });
            star.addEventListener('mouseenter', () => {
                const hoverVal = +star.dataset.star;
                stars.forEach(s => {
                    s.classList.toggle('active', +s.dataset.star <= hoverVal);
                });
            });
        });
        starsContainer.addEventListener('mouseleave', () => {
            stars.forEach(s => {
                s.classList.toggle('active', +s.dataset.star <= selectedRating);
            });
        });
    }

    // --- REVIEW FORM ---
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reviewName').value.trim();
            const role = document.getElementById('reviewRole').value.trim();
            const text = document.getElementById('reviewText').value.trim();

            if (!name || !text) return;

            const card = document.createElement('div');
            card.className = 'review-card visible';
            card.innerHTML = `
                <div class="review-card__stars">${'★'.repeat(selectedRating)}${'★'.repeat(5 - selectedRating).replace(/★/g, '<span style="opacity:0.3">★</span>')}</div>
                <p class="review-card__text">${escapeHTML(text)}</p>
                <div class="review-card__author">
                    <div class="review-card__avatar">${escapeHTML(name.charAt(0).toUpperCase())}</div>
                    <div class="review-card__info">
                        <span class="review-card__name">${escapeHTML(name)}</span>
                        <span class="review-card__role">${escapeHTML(role || 'Клиент')}</span>
                    </div>
                </div>
            `;
            reviewsGrid.appendChild(card);
            reviewsGrid.scrollTo({ left: reviewsGrid.scrollWidth, behavior: 'smooth' });

            const reviewMsg = `⭐ <b>Новый отзыв на сайте</b>\n\n${'⭐'.repeat(selectedRating)} (${selectedRating}/5)\n👤 <b>${escapeHTML(name)}</b> — ${escapeHTML(role || 'Клиент')}\n💬 ${escapeHTML(text)}`;
            sendToTelegram(reviewMsg);

            const btn = reviewForm.querySelector('button[type="submit"]');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = 'Спасибо за отзыв!';
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.7';

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.pointerEvents = '';
                btn.style.opacity = '';
                reviewForm.reset();
                selectedRating = 5;
                starsContainer.querySelectorAll('span').forEach(s => s.classList.add('active'));
            }, 2500);
        });
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- TELEGRAM BOT ---
    const TG_TOKEN = '8702699145:AAF71tbEj8iWNZbhQWCaQuPj9S9faX5UDNQ';
    const TG_CHAT = '8558424496';

    function sendToTelegram(text) {
        return fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' })
        });
    }

    // --- CONTACT FORM ---
    const form = document.getElementById('contactForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        const originalHTML = btn.innerHTML;
        const inputs = form.querySelectorAll('.form__input');

        const name = inputs[0].value.trim();
        const contact = inputs[1].value.trim();
        const service = inputs[2].value || 'Не выбрано';
        const message = inputs[3].value.trim();

        const text = `📩 <b>Новая заявка с сайта</b>\n\n👤 <b>Имя:</b> ${name}\n📱 <b>Контакт:</b> ${contact}\n📋 <b>Услуга:</b> ${service}\n💬 <b>Сообщение:</b> ${message}`;

        btn.innerHTML = '<span>Отправка...</span>';
        btn.style.pointerEvents = 'none';

        try {
            await sendToTelegram(text);
            btn.innerHTML = '<span>Отправлено! ✓</span>';
            btn.style.opacity = '0.7';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.pointerEvents = '';
                btn.style.opacity = '';
                form.reset();
            }, 2500);
        } catch {
            btn.innerHTML = '<span>Ошибка, попробуйте ещё раз</span>';
            btn.style.pointerEvents = '';
            setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
        }
    });

});
