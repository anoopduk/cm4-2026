(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  const themeColor = document.querySelector('#theme-color');
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)');
  const assetBase = new URL('.', document.currentScript?.src || document.baseURI);

  const readPreference = () => {
    try {
      return localStorage.getItem('cm4-theme');
    } catch {
      return null;
    }
  };

  const writePreference = (theme) => {
    try {
      localStorage.setItem('cm4-theme', theme);
    } catch {
      // The site remains usable when storage is unavailable.
    }
  };

  const applyTheme = (theme) => {
    const isDark = theme === 'dark';
    root.dataset.theme = isDark ? 'dark' : 'light';
    themeColor?.setAttribute('content', isDark ? '#071718' : '#f4f1e8');

    document.querySelectorAll('[data-site-logo]').forEach((logo) => {
      logo.src = new URL(isDark ? 'logo-dark.svg' : 'logo.webp', assetBase).href;
    });

    if (toggle) {
      const nextTheme = isDark ? 'light' : 'dark';
      toggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
      toggle.setAttribute('title', `Switch to ${nextTheme} theme`);
      toggle.setAttribute('aria-pressed', String(isDark));
    }
  };

  const initialTheme = root.dataset.theme || readPreference() || (systemPreference.matches ? 'dark' : 'light');
  applyTheme(initialTheme);

  toggle?.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    writePreference(nextTheme);
    applyTheme(nextTheme);
  });

  systemPreference.addEventListener?.('change', (event) => {
    if (!readPreference()) applyTheme(event.matches ? 'dark' : 'light');
  });

  const sections = [...document.querySelectorAll('main > section[id]')];
  const inPageLinks = [...document.querySelectorAll('.site-header nav a[href^="#"]')];

  if ('IntersectionObserver' in window && sections.length && inPageLinks.length) {
    const linksBySection = new Map(
      inPageLinks.map((link) => [link.getAttribute('href')?.slice(1), link])
    );

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting && linksBySection.has(entry.target.id))
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      inPageLinks.forEach((link) => link.removeAttribute('aria-current'));
      linksBySection.get(visible.target.id)?.setAttribute('aria-current', 'location');
    }, { rootMargin: '-24% 0px -68% 0px', threshold: [0, 0.15, 0.4] });

    sections.forEach((section) => observer.observe(section));
  }
})();
