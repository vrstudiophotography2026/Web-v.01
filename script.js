document.addEventListener('DOMContentLoaded', () => {

    // Absolute safety net: whatever else happens on the page, the intro
    // screen must never be able to trap the visitor. If any script below
    // throws, this still runs and guarantees the site becomes usable.
    function forceRevealSite() {
        try {
            const introLoader = document.getElementById('intro-loader');
            const mainWrapper = document.getElementById('main-wrapper');
            if (introLoader) {
                introLoader.classList.add('fade-out');
                introLoader.style.display = 'none';
            }
            if (mainWrapper) mainWrapper.classList.add('visible');
            document.body.classList.remove('locked');
            document.documentElement.style.overflow = '';
        } catch (err) {
            /* nothing more we can do */
        }
    }
    // Hard cap: no matter what, unlock after 6s even if every other
    // safeguard below somehow fails to fire.
    const hardCapTimer = setTimeout(forceRevealSite, 6000);


    // --- 1. Editorial White Fade Intro Sequence (short + skippable) ---
    (function initIntro() {
        try {
            const introLoader = document.getElementById('intro-loader');
            const mainWrapper = document.getElementById('main-wrapper');
            const skipBtn = document.getElementById('introSkip');
            if (!introLoader || !mainWrapper) { forceRevealSite(); return; }

            let finished = false;

            function finishIntro() {
                if (finished) return;
                finished = true;
                clearTimeout(hardCapTimer);

                introLoader.classList.add('fade-out');
                mainWrapper.classList.add('visible');
                document.body.classList.remove('locked');
                document.documentElement.style.overflow = '';

                // Remove the loader from layout once its fade transition
                // ends, with a fallback timer in case transitionend never
                // fires (e.g. reduced-motion, or the tab was backgrounded).
                let removed = false;
                function removeLoader() {
                    if (removed) return;
                    removed = true;
                    introLoader.style.display = 'none';
                }
                introLoader.addEventListener('transitionend', removeLoader, { once: true });
                setTimeout(removeLoader, 1200);
            }

            // Auto-play the sequence, but keep it short.
            const autoTimer = setTimeout(finishIntro, 2000);

            // Let anyone skip immediately: click/tap anywhere on the
            // intro, press any key, or start scrolling.
            function skipNow() {
                clearTimeout(autoTimer);
                finishIntro();
            }
            introLoader.addEventListener('click', skipNow);
            if (skipBtn) {
                skipBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    skipNow();
                });
            }
            window.addEventListener('keydown', skipNow, { once: true });
            window.addEventListener('wheel', skipNow, { once: true, passive: true });
            window.addEventListener('touchmove', skipNow, { once: true, passive: true });

        } catch (err) {
            console.error('Intro sequence error:', err);
            forceRevealSite();
        }
    })();


    // --- 2. Responsive Hero Crossfade Slider ---
    (function initSlider() {
        try {
            const slides = document.querySelectorAll('.slide');
            if (!slides.length) return;
            let currentSlide = 0;

            function nextSlide() {
                slides[currentSlide].classList.remove('active');
                currentSlide = (currentSlide + 1) % slides.length;
                slides[currentSlide].classList.add('active');
            }
            setInterval(nextSlide, 5000);
        } catch (err) {
            console.error('Hero slider error:', err);
        }
    })();


    // --- 3. Glassmorphism Navbar & Mobile Menu Toggle ---
    (function initNavbar() {
        try {
            const navbar = document.getElementById('navbar');
            const menuToggle = document.getElementById('mobile-menu');
            const navLinks = document.querySelector('.nav-links');
            const navItems = document.querySelectorAll('.nav-link');
            if (!navbar || !menuToggle || !navLinks) return;

            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) navbar.classList.add('scrolled');
                else navbar.classList.remove('scrolled');
            });

            function toggleMenu() {
                const isActive = menuToggle.classList.toggle('active');
                navLinks.classList.toggle('active');
                menuToggle.setAttribute('aria-expanded', String(isActive));
                if (isActive) {
                    navbar.classList.add('scrolled');
                    document.body.style.overflow = 'hidden';
                } else {
                    if (window.scrollY <= 50) navbar.classList.remove('scrolled');
                    document.body.style.overflow = '';
                }
            }

            menuToggle.addEventListener('click', toggleMenu);
            menuToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMenu();
                }
            });

            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    menuToggle.classList.remove('active');
                    navLinks.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                });
            });
        } catch (err) {
            console.error('Navbar error:', err);
        }
    })();


    // --- 4. Scroll Reveal Animations ---
    (function initScrollReveal() {
        try {
            const fadeElements = document.querySelectorAll('.fade-in-up');
            if (!fadeElements.length) return;
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

            fadeElements.forEach(el => observer.observe(el));
        } catch (err) {
            console.error('Scroll reveal error:', err);
        }
    })();


    // --- 5. Video Gallery Logic ---
    (function initVideoGallery() {
        try {
            const mainVideo = document.getElementById('main-video-player');
            const videoThumbnails = document.querySelectorAll('.vid-thumb');
            if (!mainVideo || !videoThumbnails.length) return;

            videoThumbnails.forEach(thumb => {
                thumb.addEventListener('click', () => {
                    videoThumbnails.forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');

                    mainVideo.src = thumb.getAttribute('data-video');
                    mainVideo.poster = thumb.getAttribute('data-poster');
                    mainVideo.play().catch(() => { /* autoplay may be blocked, ignore */ });
                });
            });
        } catch (err) {
            console.error('Video gallery error:', err);
        }
    })();


    // --- 6. Animated Stat Counters ---
    (function initStatCounters() {
        try {
            const counters = document.querySelectorAll('[data-count-to]');
            if (!counters.length) return;

            function animateCounter(el) {
                const target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
                const suffix = el.getAttribute('data-suffix') || '';
                const duration = 1400;
                const start = performance.now();

                function tick(now) {
                    const progress = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.round(eased * target) + suffix;
                    if (progress < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
            }

            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            counters.forEach(el => observer.observe(el));
        } catch (err) {
            console.error('Stat counter error:', err);
        }
    })();


    // --- 7. Category Gallery Modal (Fetches from Backend) ---
    (function initCategoryModal() {
        try {
            const items = Array.from(document.querySelectorAll('.gallery-item'));
            const modal = document.getElementById('categoryModal');
            const closeBtn = document.getElementById('closeCategoryModal');
            const modalTitle = document.getElementById('modalCategoryTitle');
            const galleryGrid = document.getElementById('modalGalleryGrid');
            const loader = document.getElementById('modalLoader');
            const emptyState = document.getElementById('modalEmptyState');

            if (!items.length || !modal) return;

            let lastFocused = null;

            async function openCategoryModal(category, displayTitle) {
                lastFocused = document.activeElement;
                modal.classList.add('active');
                modal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';

                modalTitle.textContent = displayTitle;
                galleryGrid.innerHTML = '';
                loader.style.display = 'block';
                emptyState.style.display = 'none';
                closeBtn.focus();

                try {
                    // Fetch images from our backend API
                    const response = await fetch(`/api/images/${category}`);
                    const images = await response.json();

                    loader.style.display = 'none';

                    if (images.length === 0) {
                        emptyState.style.display = 'block';
                    } else {
                        galleryGrid.innerHTML = images.map(imgSrc =>
                            `<img src="${imgSrc}" loading="lazy" alt="${displayTitle} image">`
                        ).join('');
                    }
                } catch (error) {
                    loader.style.display = 'none';
                    emptyState.style.display = 'block';
                    emptyState.textContent = "Error loading gallery.";
                    console.error('Failed to load gallery:', error);
                }
            }

            function closeCategoryModal() {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
                if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
            }

            items.forEach((item) => {
                const category = item.getAttribute('data-category');
                const titleEl = item.querySelector('.cap-title');
                const displayTitle = titleEl ? titleEl.textContent : category.replace('-', ' ');

                item.addEventListener('click', () => openCategoryModal(category, displayTitle));
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openCategoryModal(category, displayTitle);
                    }
                });
            });

            closeBtn.addEventListener('click', closeCategoryModal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('category-modal-body')) {
                    closeCategoryModal();
                }
            });

            window.addEventListener('keydown', (e) => {
                if (modal.classList.contains('active') && e.key === 'Escape') {
                    closeCategoryModal();
                }
            });
        } catch (err) {
            console.error('Category modal error:', err);
        }
    })();


    // --- 8. Back to Top ---
    (function initBackToTop() {
        try {
            const btn = document.getElementById('backToTop');
            if (!btn) return;

            window.addEventListener('scroll', () => {
                btn.classList.toggle('visible', window.scrollY > 600);
            });

            btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        } catch (err) {
            console.error('Back to top error:', err);
        }
    })();

});