\
(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  const metaTheme = document.querySelector('#theme-color');
  const system = window.matchMedia('(prefers-color-scheme: dark)');

  const getStored = () => {
    try { return localStorage.getItem('cm4-theme'); } catch (_) { return null; }
  };

  const store = (theme) => {
    try { localStorage.setItem('cm4-theme', theme); } catch (_) {}
  };

  const apply = (theme) => {
    root.dataset.theme = theme;
    if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#081617' : '#f4f1e8');
    if (toggle) {
      const next = theme === 'dark' ? 'light' : 'dark';
      toggle.setAttribute('aria-label', `Switch to ${next} theme`);
      toggle.setAttribute('title', `Switch to ${next} theme`);
    }
  };

  apply(root.dataset.theme || (system.matches ? 'dark' : 'light'));

  toggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    store(next);
    apply(next);
  });

  system.addEventListener?.('change', (event) => {
    if (!getStored()) apply(event.matches ? 'dark' : 'light');
  });
})();
