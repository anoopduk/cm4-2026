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

  if (!document.querySelector('link[data-cm4-enhancements]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'enhancements.css';
    style.dataset.cm4Enhancements = 'true';
    document.head.appendChild(style);
  }

  const committeeProfiles = {
    'P. N. V. Pavankumar': 'https://medschool.utsouthwestern.edu/about-the-school/office-of-medical-education/faculty-staff.html',
    'Bharatam V. Prasad': 'https://www.niper.gov.in/faculty/prof-p-v-bharatam',
    'G. Narahari Sastry': 'https://www.neist.res.in/gnsastry/contact.html',
    'G. Subramanian': 'https://ipc.iisc.ac.in/~edj/pages/members.html',
    'Ashwini Kr. Phukan': 'https://www.tezu.ernet.in/dcs/faculty/12',
    'Jayasree E. G.': 'https://chem.cusat.ac.in/facultyhome.html',
    'Pancharatna P. D.': 'https://www.amrita.edu/program/ph-d-in-chemistry/',
    'P. Parameswaran': 'https://nitc.ac.in/multidiscilplinary-centres/centre-for-qa-and-enhancement/faculty-and-staff/faculty/302f4080-a1ac-4ff3-9ebe-98a3424edbd3',
    'D. L. V. K. Prasad': 'https://www.iitk.ac.in/d-l-v-k-prasad',
    'Biswarup Pathak': 'https://people.iiti.ac.in/~biswarup/',
    'Dandamudi Usharani': 'https://cftri.res.in/Profile/2370.pdf',
    'Dibyendu Mallick': 'https://presiuniv.ac.in/web/staff.php?staffid=420',
    'Priyakumari C. P.': 'https://web.iisermohali.ac.in/dept/dcs/index.php/faculty-and-staff/faculty-cpp',
    'Naiwrit Karmodak': 'https://snu.edu.in/faculty/naiwrit-karmodak/'
  };

  document.querySelectorAll('.compact-list .person-card').forEach((card) => {
    const name = card.querySelector('h3')?.textContent?.trim();
    const href = committeeProfiles[name];
    if (!href || card.tagName === 'A') return;
    const link = document.createElement('a');
    link.className = card.className;
    link.href = href;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.innerHTML = card.innerHTML + '<span class="profile-arrow" aria-hidden="true">↗</span>';
    card.replaceWith(link);
  });

  const organiserProfiles = {
    'C. H. Suresh': 'https://sribs.res.in/dr-suresh-c-h/',
    'Mahesh Hariharan': 'https://www.iisertvm.ac.in/pages/deputy-director'
  };
  document.querySelectorAll('.organisers a.person-card').forEach((card) => {
    const name = card.querySelector('h3')?.textContent?.trim();
    if (organiserProfiles[name]) card.href = organiserProfiles[name];
  });

  const venue = document.querySelector('#venue');
  const travel = venue?.querySelector('.travel-block');
  if (venue && travel && !venue.querySelector('.poovar-gallery')) {
    const gallery = document.createElement('div');
    gallery.className = 'poovar-gallery';
    gallery.innerHTML = `
      <figure class="poovar-photo">
        <img src="assets/poovar-coast.webp" alt="Poovar beach and backwaters in Kerala" loading="lazy" decoding="async" width="960" height="540">
        <figcaption>Poovar — backwaters meeting the coast</figcaption>
      </figure>
      <figure class="poovar-photo">
        <img src="assets/poovar-mangroves.webp" alt="Boat travelling through the mangrove backwaters of Poovar" loading="lazy" decoding="async" width="720" height="480">
        <figcaption>Mangrove backwaters</figcaption>
      </figure>
      <p class="photo-credit">
        Poovar coast: Midhun Subhash, <a href="https://commons.wikimedia.org/wiki/File:Poovar_Kerala.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, CC0.
        Mangrove backwaters: Deepsikder, <a href="https://commons.wikimedia.org/wiki/File:Poovar_Backwater.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>,
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>; cropped and converted to WebP for this site.
      </p>`;
    travel.before(gallery);
  }
})();
