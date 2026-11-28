const theme = document.querySelector('[data-theme-toggle]');
if (theme) {
  theme.hidden = false;
  const sync = () => theme.setAttribute('aria-label', `Switch to ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} theme`);
  sync();
  theme.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('cm4-theme', next); } catch {}
    sync();
  });
}
const search = document.querySelector('#people-search');
if (search) {
  search.closest('.directory-search').hidden = false;
  const rows = [...document.querySelectorAll('.participant-directory-card, .participant-student-list > li')];
  const key = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const words = rows.map(row => key(row.textContent));
  const filter = () => {
    const terms = key(search.value).trim().split(/\s+/).filter(Boolean);
    let count = 0;
    rows.forEach((row, i) => { row.hidden = !terms.every(term => words[i].includes(term)); if (!row.hidden) count++; });
    document.querySelector('#people-results').textContent = terms.length ? `${count} ${count === 1 ? 'match' : 'matches'}` : '';
  };
  search.addEventListener('input', filter);
  filter();
}
