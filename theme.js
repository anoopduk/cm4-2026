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

  const programmeDays = [...document.querySelectorAll('.programme-day')];
  const mobileProgramme = window.matchMedia('(max-width: 700px)');

  const syncProgrammeDays = () => {
    if (!programmeDays.length) return;

    if (!mobileProgramme.matches) {
      programmeDays.forEach((day) => { day.open = true; });
      return;
    }

    const firstOpenDay = programmeDays.find((day) => day.open) || programmeDays[0];
    programmeDays.forEach((day) => { day.open = day === firstOpenDay; });
  };

  programmeDays.forEach((day) => {
    day.addEventListener('toggle', () => {
      if (!mobileProgramme.matches || !day.open) return;
      programmeDays.forEach((otherDay) => {
        if (otherDay !== day) otherDay.open = false;
      });
    });
  });

  mobileProgramme.addEventListener?.('change', syncProgrammeDays);
  syncProgrammeDays();

  /* Keep newly confirmed participants visible immediately. The generated source data
     contains the same records, so this bridge becomes a no-op after regeneration. */
  const participantPatches = [
    {
      id: 'padmesh-anjukandi',
      name: 'Padmesh Anjukandi',
      initials: 'PA',
      affiliation: 'IIT Palakkad',
      profile: 'https://iitpkd.ac.in/people/padmesh',
      image: new URL('assets/people/padmesh-anjukandi.webp', assetBase).href
    },
    {
      id: 'u-deva-priyakumar',
      name: 'U. Deva Priyakumar',
      initials: 'UDP',
      affiliation: 'IIIT Hyderabad',
      profile: 'https://www.iiit.ac.in/faculty/deva-priyakumar-u/',
      image: 'https://www.iiit.ac.in/wp-content/uploads/2022/12/Deva-Priyakumar-U-300x300.jpg'
    }
  ];

  const mosaic = document.querySelector('.participant-mosaic');
  if (mosaic) {
    participantPatches.forEach((participant) => {
      if (mosaic.querySelector(`a[href="participants/#${participant.id}"]`)) return;
      const link = document.createElement('a');
      link.className = 'participant-thumb';
      link.href = `participants/#${participant.id}`;
      link.setAttribute('aria-label', `View ${participant.name} in the participant directory`);
      link.title = participant.name;
      link.innerHTML = `<img src="${participant.image}" alt="${participant.name}" loading="lazy" decoding="async" width="480" height="600">`;
      mosaic.appendChild(link);
    });

    [...mosaic.children]
      .sort((a, b) => (a.title || '').localeCompare(b.title || '', 'en', { sensitivity: 'base' }))
      .forEach((card) => mosaic.appendChild(card));

    const count = mosaic.children.length;
    const countStrong = document.querySelector('.participant-count strong');
    const countLabel = document.querySelector('.participant-preview-label span');
    if (countStrong) countStrong.textContent = String(count);
    if (countLabel) countLabel.textContent = `${count} confirmed`;
  }

  const directoryGrid = document.querySelector('.participant-directory-grid');
  if (directoryGrid) {
    participantPatches.forEach((participant) => {
      if (document.getElementById(participant.id)) return;
      const card = document.createElement('a');
      card.className = 'participant-directory-card';
      card.id = participant.id;
      card.href = participant.profile;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.innerHTML = `<span class="participant-directory-portrait"><span class="person-mark">${participant.initials}</span><img src="${participant.image}" alt="${participant.name}" loading="lazy" decoding="async" width="480" height="600"></span><div class="participant-directory-copy"><h2>${participant.name}</h2><p>${participant.affiliation}</p></div><span class="profile-arrow" aria-hidden="true">↗</span>`;
      directoryGrid.appendChild(card);
    });

    [...directoryGrid.children]
      .sort((a, b) => (a.querySelector('h2')?.textContent || '').localeCompare(b.querySelector('h2')?.textContent || '', 'en', { sensitivity: 'base' }))
      .forEach((card) => directoryGrid.appendChild(card));

    const count = directoryGrid.children.length;
    const directoryCount = document.querySelector('.directory-heading > p strong');
    if (directoryCount) directoryCount.textContent = String(count);
  }

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