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

  if (!document.querySelector('link[href="programme.css"]')) {
    const programmeStyles = document.createElement('link');
    programmeStyles.rel = 'stylesheet';
    programmeStyles.href = 'programme.css';
    document.head.appendChild(programmeStyles);
  }

  /* Public programme. The CM4 calendar remains the internal planning source;
     this website view is intentionally compact and participant-facing. */
  const programme = [
    {
      date: '3 December',
      day: 'Thursday',
      note: 'Arrival day',
      items: [
        ['13:00–14:00', 'Lunch', 'meal'],
        ['14:15–15:30', 'Inauguration and Session 1', 'session'],
        ['15:30–16:00', 'Tea Break', 'break'],
        ['16:00–18:30', 'Session 2', 'session'],
        ['19:00–21:00', 'Dinner', 'meal']
      ]
    },
    {
      date: '4 December',
      day: 'Friday',
      note: 'Scientific sessions',
      items: [
        ['09:00–10:30', 'Session 3', 'session'],
        ['10:30–11:00', 'Tea Break', 'break'],
        ['11:00–13:00', 'Session 4', 'session'],
        ['13:00–14:00', 'Lunch', 'meal'],
        ['14:00–15:30', 'Session 5', 'session'],
        ['15:30–16:00', 'Tea Break', 'break'],
        ['16:00–18:30', 'Session 6', 'session'],
        ['19:00–21:00', 'Dinner', 'meal']
      ]
    },
    {
      date: '5 December',
      day: 'Saturday',
      note: 'Science and local programme',
      items: [
        ['09:00–10:30', 'Session 7', 'session'],
        ['10:30–11:00', 'Tea Break', 'break'],
        ['11:00–13:00', 'Session 8', 'session'],
        ['13:00–14:00', 'Lunch', 'meal'],
        ['14:00–18:00', 'Local Visit', 'special'],
        ['18:30–20:00', 'Felicitation Session', 'special'],
        ['20:00–22:00', 'Conference Dinner', 'special']
      ]
    },
    {
      date: '6 December',
      day: 'Sunday',
      note: 'Closing day',
      items: [
        ['09:00–10:30', 'Session 9', 'session'],
        ['10:30–11:00', 'Tea Break', 'break'],
        ['11:00–12:30', 'Session 10', 'session'],
        ['12:30–13:00', 'Valedictory Session', 'special'],
        ['13:00 onwards', 'Lunch and Departure', 'meal']
      ]
    }
  ];

  const participants = document.querySelector('#participants');
  if (participants && !document.querySelector('#programme')) {
    const days = programme.map((entry) => `
      <article class="programme-day">
        <header class="programme-day-head">
          <div><p>${entry.day}</p><h3>${entry.date}</h3></div>
          <span>${entry.note}</span>
        </header>
        <div class="programme-items">
          ${entry.items.map(([time, label, type]) => `
            <div class="programme-item programme-${type}">
              <time>${time}</time><strong>${label}</strong>
            </div>`).join('')}
        </div>
      </article>`).join('');

    participants.insertAdjacentHTML('afterend', `
      <section class="section programme" id="programme">
        <div class="section-kicker"><span>03</span><p>Programme</p></div>
        <div class="programme-head">
          <div><h2>Four days at CM4</h2></div>
          <div class="programme-intro"><p>Ten scientific sessions are planned across the meeting. The detailed talk schedule will be added as speaker assignments are finalised.</p><p>All times are in Indian Standard Time (IST).</p></div>
        </div>
        <div class="programme-grid" aria-label="CM4 2026 programme outline">${days}</div>
      </section>`);

    const venueNumber = document.querySelector('#venue .section-kicker span');
    const registrationNumber = document.querySelector('#registration .section-kicker span');
    const committeeNumber = document.querySelector('#committees .section-kicker span');
    if (venueNumber) venueNumber.textContent = '04';
    if (registrationNumber) registrationNumber.textContent = '05';
    if (committeeNumber) committeeNumber.textContent = '06';

    const participantNav = document.querySelector('nav a[href="#participants"]');
    if (participantNav && !document.querySelector('nav a[href="#programme"]')) {
      participantNav.insertAdjacentHTML('afterend', '<a href="#programme">Programme</a>');
    }
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

  /* Participant transfer information */
  const travelIntro = document.querySelector('.travel-intro > p:last-child');
  if (travelIntro) {
    travelIntro.textContent = 'Conference organisers will arrange pick-up and drop-off for participants from Thiruvananthapuram International Airport and Thiruvananthapuram Central railway station.';
  }

  document.querySelectorAll('.travel-card').forEach((card) => {
    const label = card.querySelector('.travel-label');
    if (label?.textContent.trim() === 'Airport transfer') {
      label.textContent = 'Conference transfer';
      const heading = card.querySelector('h4');
      const detail = card.querySelector('p:last-child');
      if (heading) heading.textContent = 'Airport and railway station pick-up / drop-off';
      if (detail) detail.textContent = 'Transfer arrangements will be coordinated by the conference organisers. Participants will be asked to share their arrival and departure details.';
    }
  });

  /* Registration inclusions */
  const registrationSummary = document.querySelector('.registration-head > p');
  if (registrationSummary) {
    registrationSummary.textContent = 'Registration is for invited participants and includes accommodation, conference materials, conference dinner, the local visit / sightseeing programme, and local transfers.';
  }

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    link.setAttribute('rel', 'noopener noreferrer');
  });
})();
