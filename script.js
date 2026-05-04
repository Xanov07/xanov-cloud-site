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

    // --- LANGUAGE SWITCHER ---
    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');
    const langLabels = { ru: 'RU', en: 'EN', es: 'ES', uk: 'UA' };
    let currentLang = localStorage.getItem('lang') || 'ru';

    // Mapping: CSS selector → i18n key (text or innerHTML)
    const i18nMap = [
        // Nav
        { sel: '.nav .nav__link[href="#services"]', key: 'nav_services' },
        { sel: '.nav .nav__link[href="#cases"]', key: 'nav_cases' },
        { sel: '.nav .nav__link[href="#solutions"]', key: 'nav_solutions' },
        { sel: '.nav .nav__link[href="#process"]', key: 'nav_process' },
        { sel: '.nav .nav__link[href="#reviews"]', key: 'nav_reviews' },
        { sel: '.nav .nav__link[href="#about"]', key: 'nav_about' },
        { sel: '.header__cta', key: 'nav_cta' },
        // Mobile nav
        { sel: '.mobile-menu__link[href="#services"]', key: 'nav_services' },
        { sel: '.mobile-menu__link[href="#cases"]', key: 'nav_cases' },
        { sel: '.mobile-menu__link[href="#solutions"]', key: 'nav_solutions' },
        { sel: '.mobile-menu__link[href="#process"]', key: 'nav_process' },
        { sel: '.mobile-menu__link[href="#reviews"]', key: 'nav_reviews' },
        { sel: '.mobile-menu__link[href="#about"]', key: 'nav_about' },
        { sel: '.mobile-menu__nav .btn--primary', key: 'nav_cta' },
        // Hero
        { sel: '.hero__badge', key: 'hero_badge', html: true, prefix: '<span class="hero__badge-dot"></span> ' },
        { sel: '.hero__title', key: null, custom: (t) => `${t.hero_title_1}<br>${t.hero_title_2}<span class="gradient-text">${t.hero_title_accent}</span>` },
        { sel: '.hero__subtitle', key: 'hero_subtitle' },
        { sel: '.hero__actions .btn--primary', key: 'hero_btn_start', html: true, suffix: ' <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' },
        { sel: '.hero__actions .btn--ghost', key: 'hero_btn_cases' },
        { sel: '.hero__stat:nth-child(1) .hero__stat-label', key: 'hero_stat_projects' },
        { sel: '.hero__stat:nth-child(3) .hero__stat-label', key: 'hero_stat_clients' },
        { sel: '.hero__stat:nth-child(5) .hero__stat-label', key: 'hero_stat_automations' },
        // Services
        { sel: '#services .section__tag', key: 'services_tag' },
        { sel: '#services .section__title', key: 'services_title' },
        { sel: '#services .section__desc', key: 'services_desc' },
        { sel: '.service-card:nth-child(1) .service-card__title', key: 'service1_title' },
        { sel: '.service-card:nth-child(1) .service-card__desc', key: 'service1_desc' },
        { sel: '.service-card:nth-child(1) .service-card__list li:nth-child(1)', key: 'service1_li1' },
        { sel: '.service-card:nth-child(1) .service-card__list li:nth-child(2)', key: 'service1_li2' },
        { sel: '.service-card:nth-child(1) .service-card__list li:nth-child(3)', key: 'service1_li3' },
        { sel: '.service-card:nth-child(1) .service-card__list li:nth-child(4)', key: 'service1_li4' },
        { sel: '.service-card:nth-child(2) .service-card__title', key: 'service2_title' },
        { sel: '.service-card:nth-child(2) .service-card__desc', key: 'service2_desc' },
        { sel: '.service-card:nth-child(2) .service-card__list li:nth-child(1)', key: 'service2_li1' },
        { sel: '.service-card:nth-child(2) .service-card__list li:nth-child(2)', key: 'service2_li2' },
        { sel: '.service-card:nth-child(2) .service-card__list li:nth-child(3)', key: 'service2_li3' },
        { sel: '.service-card:nth-child(2) .service-card__list li:nth-child(4)', key: 'service2_li4' },
        { sel: '.service-card:nth-child(3) .service-card__title', key: 'service3_title' },
        { sel: '.service-card:nth-child(3) .service-card__desc', key: 'service3_desc' },
        { sel: '.service-card:nth-child(3) .service-card__list li:nth-child(1)', key: 'service3_li1' },
        { sel: '.service-card:nth-child(3) .service-card__list li:nth-child(2)', key: 'service3_li2' },
        { sel: '.service-card:nth-child(3) .service-card__list li:nth-child(3)', key: 'service3_li3' },
        { sel: '.service-card:nth-child(3) .service-card__list li:nth-child(4)', key: 'service3_li4' },
        { sel: '.service-card:nth-child(4) .service-card__title', key: 'service4_title' },
        { sel: '.service-card:nth-child(4) .service-card__desc', key: 'service4_desc' },
        { sel: '.service-card:nth-child(4) .service-card__list li:nth-child(1)', key: 'service4_li1' },
        { sel: '.service-card:nth-child(4) .service-card__list li:nth-child(2)', key: 'service4_li2' },
        { sel: '.service-card:nth-child(4) .service-card__list li:nth-child(3)', key: 'service4_li3' },
        { sel: '.service-card:nth-child(4) .service-card__list li:nth-child(4)', key: 'service4_li4' },
        // Cases
        { sel: '#cases .section__tag', key: 'cases_tag' },
        { sel: '#cases .section__title', key: 'cases_title' },
        { sel: '#cases .section__desc', key: 'cases_desc' },
        { sel: '.case-card:nth-child(1) .tag:nth-child(1)', key: 'case1_tag1' },
        { sel: '.case-card:nth-child(1) .tag:nth-child(2)', key: 'case1_tag2' },
        { sel: '.case-card:nth-child(1) .case-card__title', key: 'case1_title' },
        { sel: '.case-card:nth-child(1) .case-card__desc', key: 'case1_desc' },
        { sel: '.case-card:nth-child(1) .case-card__result:nth-child(1) .case-card__result-value', key: 'case1_val1' },
        { sel: '.case-card:nth-child(1) .case-card__result:nth-child(1) .case-card__result-label', key: 'case1_label1' },
        { sel: '.case-card:nth-child(1) .case-card__result:nth-child(2) .case-card__result-value', key: 'case1_val2' },
        { sel: '.case-card:nth-child(1) .case-card__result:nth-child(2) .case-card__result-label', key: 'case1_label2' },
        { sel: '.case-card:nth-child(2) .tag:nth-child(1)', key: 'case2_tag1' },
        { sel: '.case-card:nth-child(2) .tag:nth-child(2)', key: 'case2_tag2' },
        { sel: '.case-card:nth-child(2) .case-card__title', key: 'case2_title' },
        { sel: '.case-card:nth-child(2) .case-card__desc', key: 'case2_desc' },
        { sel: '.case-card:nth-child(2) .case-card__result:nth-child(1) .case-card__result-value', key: 'case2_val1' },
        { sel: '.case-card:nth-child(2) .case-card__result:nth-child(1) .case-card__result-label', key: 'case2_label1' },
        { sel: '.case-card:nth-child(2) .case-card__result:nth-child(2) .case-card__result-value', key: 'case2_val2' },
        { sel: '.case-card:nth-child(2) .case-card__result:nth-child(2) .case-card__result-label', key: 'case2_label2' },
        { sel: '.case-card:nth-child(3) .tag:nth-child(1)', key: 'case3_tag1' },
        { sel: '.case-card:nth-child(3) .tag:nth-child(2)', key: 'case3_tag2' },
        { sel: '.case-card:nth-child(3) .case-card__title', key: 'case3_title' },
        { sel: '.case-card:nth-child(3) .case-card__desc', key: 'case3_desc' },
        { sel: '.case-card:nth-child(3) .case-card__result:nth-child(1) .case-card__result-value', key: 'case3_val1' },
        { sel: '.case-card:nth-child(3) .case-card__result:nth-child(1) .case-card__result-label', key: 'case3_label1' },
        { sel: '.case-card:nth-child(3) .case-card__result:nth-child(2) .case-card__result-value', key: 'case3_val2' },
        { sel: '.case-card:nth-child(3) .case-card__result:nth-child(2) .case-card__result-label', key: 'case3_label2' },
        // Solutions
        { sel: '#solutions .section__tag', key: 'solutions_tag' },
        { sel: '#solutions .section__title', key: 'solutions_title' },
        { sel: '#solutions .section__desc', key: 'solutions_desc' },
        { sel: '.solution-card:nth-child(1) .solution-card__badge', key: 'solution1_badge' },
        { sel: '.solution-card:nth-child(1) .solution-card__title', key: 'solution1_title' },
        { sel: '.solution-card:nth-child(1) .solution-card__desc', key: 'solution1_desc' },
        { sel: '.solution-card:nth-child(1) .solution-card__price-value', key: 'solution1_price' },
        { sel: '.solution-card:nth-child(1) .btn--outline', key: 'solution_btn' },
        { sel: '.solution-card:nth-child(2) .solution-card__badge', key: 'solution2_badge' },
        { sel: '.solution-card:nth-child(2) .solution-card__title', key: 'solution2_title' },
        { sel: '.solution-card:nth-child(2) .solution-card__desc', key: 'solution2_desc' },
        { sel: '.solution-card:nth-child(2) .solution-card__price-value', key: 'solution2_price' },
        { sel: '.solution-card:nth-child(2) .btn--outline', key: 'solution_btn' },
        { sel: '.solution-card:nth-child(3) .solution-card__title', key: 'solution3_title' },
        { sel: '.solution-card:nth-child(3) .solution-card__desc', key: 'solution3_desc' },
        { sel: '.solution-card:nth-child(3) .solution-card__price-value', key: 'solution3_price' },
        { sel: '.solution-card:nth-child(3) .btn--outline', key: 'solution_btn' },
        { sel: '.solution-card:nth-child(4) .solution-card__title', key: 'solution4_title' },
        { sel: '.solution-card:nth-child(4) .solution-card__desc', key: 'solution4_desc' },
        { sel: '.solution-card:nth-child(4) .solution-card__price-value', key: 'solution4_price' },
        { sel: '.solution-card:nth-child(4) .btn--outline', key: 'solution_btn' },
        // Process
        { sel: '#process .section__tag', key: 'process_tag' },
        { sel: '#process .section__title', key: 'process_title' },
        { sel: '#process .section__desc', key: 'process_desc' },
        { sel: '.process__step:nth-child(1) .process__step-title', key: 'step1_title' },
        { sel: '.process__step:nth-child(1) .process__step-desc', key: 'step1_desc' },
        { sel: '.process__step:nth-child(2) .process__step-title', key: 'step2_title' },
        { sel: '.process__step:nth-child(2) .process__step-desc', key: 'step2_desc' },
        { sel: '.process__step:nth-child(3) .process__step-title', key: 'step3_title' },
        { sel: '.process__step:nth-child(3) .process__step-desc', key: 'step3_desc' },
        { sel: '.process__step:nth-child(4) .process__step-title', key: 'step4_title' },
        { sel: '.process__step:nth-child(4) .process__step-desc', key: 'step4_desc' },
        // Reviews
        { sel: '#reviews .section__tag', key: 'reviews_tag' },
        { sel: '#reviews .section__title', key: 'reviews_title' },
        { sel: '#reviews .section__desc', key: 'reviews_desc' },
        { sel: '.reviews__form-title', key: 'review_form_title' },
        { sel: '#reviewForm .btn--primary', key: 'review_btn' },
        // About
        { sel: '#about .section__tag', key: 'about_tag' },
        { sel: '.about__title', key: 'about_title' },
        { sel: '.about__text:nth-child(3)', key: 'about_text1' },
        { sel: '.about__text:nth-child(4)', key: 'about_text2' },
        // Contact
        { sel: '#contact .section__tag', key: 'contact_tag' },
        { sel: '.contact__title', key: 'contact_title', html: true },
        { sel: '.contact__desc', key: 'contact_desc' },
        // Footer
        { sel: '.footer__copy', key: 'footer_copy' },
        { sel: '.footer__links a[href="#services"]', key: 'footer_services' },
        { sel: '.footer__links a[href="#cases"]', key: 'footer_cases' },
        { sel: '.footer__links a[href="#solutions"]', key: 'footer_solutions' },
        { sel: '.footer__links a[href="#contact"]', key: 'footer_contacts' },
    ];

    // Placeholder mappings
    const i18nPlaceholders = [
        { sel: '#reviewName', key: 'review_name_ph' },
        { sel: '#reviewRole', key: 'review_role_ph' },
        { sel: '#reviewText', key: 'review_text_ph' },
        { sel: '#contactForm .form__input:nth-child(1) input, #contactForm .form__group:nth-child(1) .form__input', key: 'form_name' },
        { sel: '#contactForm .form__group:nth-child(2) .form__input', key: 'form_contact' },
        { sel: '#contactForm .form__group:nth-child(4) .form__textarea', key: 'form_message' },
    ];

    // Select options
    const i18nOptions = [
        { sel: '#contactForm .form__select option[value=""]', key: 'form_select' },
        { sel: '#contactForm .form__select option[value="automation"]', key: 'form_opt_automation' },
        { sel: '#contactForm .form__select option[value="chatbot"]', key: 'form_opt_chatbot' },
        { sel: '#contactForm .form__select option[value="website"]', key: 'form_opt_website' },
        { sel: '#contactForm .form__select option[value="app"]', key: 'form_opt_app' },
        { sel: '#contactForm .form__select option[value="template"]', key: 'form_opt_template' },
        { sel: '#contactForm .form__select option[value="other"]', key: 'form_opt_other' },
    ];

    function applyLang(lang) {
        const t = translations[lang];
        if (!t) return;
        currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
        langBtn.textContent = langLabels[lang] + ' ▾';

        i18nMap.forEach(({ sel, key, html, prefix, suffix, custom }) => {
            const el = document.querySelector(sel);
            if (!el) return;
            if (custom) { el.innerHTML = custom(t); return; }
            const val = (prefix || '') + t[key] + (suffix || '');
            if (html) el.innerHTML = val; else el.textContent = t[key];
        });

        i18nPlaceholders.forEach(({ sel, key }) => {
            const el = document.querySelector(sel);
            if (el) el.placeholder = t[key];
        });

        i18nOptions.forEach(({ sel, key }) => {
            const el = document.querySelector(sel);
            if (el) el.textContent = t[key];
        });

        // Contact form submit button
        const formBtn = document.querySelector('#contactForm button[type="submit"]');
        if (formBtn) formBtn.innerHTML = t.form_btn + ' <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }

    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('active');
    });

    langDropdown.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            applyLang(btn.dataset.lang);
            langDropdown.classList.remove('active');
        });
    });

    document.addEventListener('click', () => langDropdown.classList.remove('active'));

    if (currentLang !== 'ru') applyLang(currentLang);

    // --- SOLUTIONS FILTERS ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const solutionCards = document.querySelectorAll('.solution-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
            btn.classList.add('filter-btn--active');
            const filter = btn.dataset.filter;
            solutionCards.forEach(card => {
                if (filter === 'all') {
                    card.classList.remove('solution-card--hidden');
                } else {
                    const cats = (card.dataset.category || '').split(' ');
                    card.classList.toggle('solution-card--hidden', !cats.includes(filter));
                }
            });
        });
    });

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

            // Отправка данных в Finance Agent
            if (service === 'template' || true) {
                await fetch('https://n8n.xanov.cloud/webhook/website-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        contact: contact,
                        service: service,
                        message: message,
                        timestamp: new Date().toISOString()
                    })
                });
            }

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
