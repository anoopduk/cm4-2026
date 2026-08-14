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

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      store(next);
      apply(next);
    });
  }

  if (system.addEventListener) {
    system.addEventListener('change', (event) => {
      if (!getStored()) apply(event.matches ? 'dark' : 'light');
    });
  }

  /* Keep public profile links on current official/institutional pages.
     The image filename is the stable local identifier for each card. */
  const profileLinks = {
    'odile-eisenstein.webp': 'https://www.icgm.fr/odile-eisenstein/',
    'milan-kumar-jena.webp': 'https://www.iitbhilai.ac.in/index.php/index.php?pid=profile_milanjena',
    'sabyasachi-mishra.webp': 'https://ccds.iitkgp.ac.in/people.php',
    't-pradeep.webp': 'https://ioe.iitm.ac.in/people/t-pradeep/',
    'sai-g-ramesh.webp': 'https://ipc.iisc.ac.in/sgr',
    'rb-sunoj.webp': 'https://www.chem.iitb.ac.in/facultyuserview/r-b-sunoj',
    'jayasree-eg.webp': 'https://chem.cusat.ac.in/facultymain/faculty_jayasree.html',
    'p-parameswaran.webp': 'https://nitc.ac.in/department/chemistry/faculty-and-staff/faculty/62a9431e-5edc-41cf-8cf5-2b47d6889937',
    'biswarup-pathak.webp': 'https://chemistry.iiti.ac.in/faculty/prof-biswarup-pathak',
    'dandamudi-usharani.webp': 'https://www.cftri.res.in/index.php/faculty_detail/2370',
    'priyakumari-cp.webp': 'https://www.iisermohali.ac.in/faculty/dcs/cppriyakumari',
    'naiwrit-karmodak.webp': 'https://snu.edu.in/schools/school-of-natural-sciences/faculty/naiwrit-karmodak/'
  };

  document.querySelectorAll('.person-card .person-photo').forEach((photo) => {
    const filename = photo.getAttribute('src')?.split('/').pop();
    const card = photo.closest('.person-card');
    if (!filename || !card) return;

    if (card.matches('a') && profileLinks[filename]) {
      card.setAttribute('href', profileLinks[filename]);
    }

    if (filename === 'a-sirohiwal.webp') {
      photo.setAttribute('alt', 'Abhishek Sirohiwal');
      const heading = card.querySelector('h3');
      if (heading) heading.textContent = 'Abhishek Sirohiwal';
    }
  });

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    link.setAttribute('rel', 'noopener noreferrer');
  });
})();
