const themeToggle = document.getElementById('themeToggle');
const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)');
const prefersReducedMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navBackdrop = document.getElementById('navBackdrop');
const sections = document.querySelectorAll('section[id]');
const fadeElements = document.querySelectorAll('.fade-up');
const counters = document.querySelectorAll('.stat-number');
const statsSection = document.querySelector('.hero-stats');

let savedTheme = null;

try {
    savedTheme = localStorage.getItem('theme');
} catch (error) {
    savedTheme = null;
}

function updateThemeToggleState(dark) {
    if (!themeToggle) {
        return;
    }

    const nextTheme = dark ? 'light' : 'dark';
    themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    themeToggle.setAttribute('title', `Switch to ${nextTheme} mode`);
    themeToggle.setAttribute('aria-pressed', String(dark));
}

function setTheme(dark, persist = true) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    updateThemeToggleState(dark);

    if (!persist) {
        return;
    }

    try {
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch (error) {
        // Ignore storage failures and keep the in-memory theme.
    }
}

setTheme(savedTheme ? savedTheme === 'dark' : prefersDark.matches, false);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const nextDark = !isDark;
        savedTheme = nextDark ? 'dark' : 'light';
        setTheme(nextDark);
    });
}

if (typeof prefersDark.addEventListener === 'function') {
    prefersDark.addEventListener('change', (event) => {
        if (!savedTheme) {
            setTheme(event.matches, false);
        }
    });
}

function setMenuOpen(open) {
    if (!navToggle || !navLinks) {
        return;
    }

    navToggle.classList.toggle('active', open);
    navLinks.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);

    if (navBackdrop) {
        navBackdrop.classList.toggle('open', open);
    }

    if (open) {
        // Move focus into sidebar so screen readers announce it
        const firstLink = navLinks.querySelector('a');
        if (firstLink) {
            firstLink.focus();
        }
    } else {
        navToggle.focus();
    }
}

function updateNavScrollState() {
    if (!nav) {
        return;
    }

    nav.classList.toggle('scrolled', globalThis.scrollY > 50);
}

let navTicking = false;

function onScroll() {
    if (navTicking) {
        return;
    }

    navTicking = true;
    requestAnimationFrame(() => {
        updateNavScrollState();
        updateActiveNav();
        navTicking = false;
    });
}

if (nav) {
    globalThis.addEventListener('scroll', onScroll, { passive: true });
    updateNavScrollState();
}

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.contains('open');
        setMenuOpen(!isOpen);
    });

    if (navBackdrop) {
        navBackdrop.addEventListener('click', () => setMenuOpen(false));
    }

    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            setMenuOpen(false);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navLinks.classList.contains('open')) {
            setMenuOpen(false);
        }
    });
}

function updateActiveNav() {
    if (!navLinks) {
        return;
    }

    const scrollY = globalThis.scrollY + 100;

    sections.forEach((section) => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        const link = navLinks?.querySelector(`a[href="#${id}"]`);

        if (!link) {
            return;
        }

        link.classList.toggle('active', scrollY >= top && scrollY < top + height);
    });
}

updateActiveNav();

function revealAllFadeElements() {
    fadeElements.forEach((element) => element.classList.add('visible'));
}

if ('IntersectionObserver' in globalThis) {
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    fadeElements.forEach((element) => revealObserver.observe(element));
} else {
    revealAllFadeElements();
}

function animateCounters() {
    counters.forEach((counter) => {
        const target = Number.parseInt(counter.getAttribute('data-count') || '0', 10);

        if (prefersReducedMotion.matches) {
            counter.textContent = String(target);
            return;
        }

        counter.textContent = '0';
        const duration = 1500;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = String(Math.round(eased * target));

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    });
}

if (statsSection && counters.length > 0) {
    if ('IntersectionObserver' in globalThis) {
        const statsObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateCounters();
                        statsObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        statsObserver.observe(statsSection);
    } else {
        animateCounters();
    }
}
