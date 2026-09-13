(() => {
  'use strict';
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let themeAnimating = false;
  const updateTheme = () => {
    const dark = root.dataset.theme === 'dark';
    button?.setAttribute('aria-pressed', String(dark));
    button?.setAttribute('aria-label', dark ? 'Activar tema claro' : 'Activar tema oscuro');
    const icon = button?.querySelector('span');
    if (icon) icon.textContent = dark ? '☀' : '◐';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#181c1b' : '#f5f3ed';
  };
  const applyTheme = theme => {
    root.dataset.theme = theme;
    try { localStorage.setItem('esteban-theme', theme); } catch {}
    updateTheme();
  };
  updateTheme();
  button?.addEventListener('click', async () => {
    if (themeAnimating) return;
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    button.classList.add('is-animating');
    if (motion.matches || typeof document.startViewTransition !== 'function') {
      applyTheme(nextTheme);
      window.setTimeout(() => button.classList.remove('is-animating'), 500);
      return;
    }

    themeAnimating = true;
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(() => applyTheme(nextTheme));
    try {
      await transition.ready;
      await root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 760, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }
      ).finished;
    } catch {
      // The theme still changes if the browser cannot animate a transition pseudo-element.
    } finally {
      themeAnimating = false;
      button.classList.remove('is-animating');
    }
  });
  const filters = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('[data-category]')];
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(item => {
      item.classList.toggle('is-active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    cards.forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
    });
    const count = cards.filter(card => !card.hidden).length;
    const status = document.querySelector('.project-count');
    if (status) status.textContent = count + ' proyectos';
  }));
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if ('IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    targets.forEach((el, i) => {
      el.style.setProperty('--reveal-delay', (i % 2) * 70 + 'ms');
      el.classList.add('will-reveal');
      observer.observe(el);
    });
    motion.addEventListener('change', () => {
      if (motion.matches) {
        observer.disconnect();
        targets.forEach(el => el.classList.remove('will-reveal'));
      }
    });
  }
})();
