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
    document.querySelectorAll('.site-header .brand img, footer img').forEach((logo) => {
      logo.setAttribute('src', theme === 'dark' ? 'logo-dark.svg' : 'logo.webp');
      logo.style.filter = 'none';
      logo.style.mixBlendMode = 'normal';
      logo.style.background = 'transparent';
    });
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

  const programme = [
    { date:'3 December', day:'Thursday', note:'Arrival day', items:[
      ['13:00–14:00','Lunch','meal'],['14:15–15:30','Inauguration and Session 1','session'],['15:30–16:00','Tea Break','break'],['16:00–18:30','Session 2','session'],['19:00–21:00','Dinner','meal'] ] },
    { date:'4 December', day:'Friday', note:'Scientific sessions', items:[
      ['09:00–10:30','Session 3','session'],['10:30–11:00','Tea Break','break'],['11:00–13:00','Session 4','session'],['13:00–14:00','Lunch','meal'],['14:00–15:30','Session 5','session'],['15:30–16:00','Tea Break','break'],['16:00–18:30','Session 6','session'],['19:00–21:00','Dinner','meal'] ] },
    { date:'5 December', day:'Saturday', note:'Science and local programme', items:[
      ['09:00–10:30','Session 7','session'],['10:30–11:00','Tea Break','break'],['11:00–13:00','Session 8','session'],['13:00–14:00','Lunch','meal'],['14:00–18:00','Local Visit','special'],['18:30–20:00','Felicitation Session','special'],['20:00–22:00','Conference Dinner','special'] ] },
    { date:'6 December', day:'Sunday', note:'Closing day', items:[
      ['09:00–10:30','Session 9','session'],['10:30–11:00','Tea Break','break'],['11:00–12:30','Session 10','session'],['12:30–13:00','Valedictory Session','special'],['13:00 onwards','Lunch and Departure','meal'] ] }
  ];

  const participants = document.querySelector('#participants');
  if (participants && !document.querySelector('#programme')) {
    const days = programme.map((entry) => `
      <article class="programme-day">
        <header class="programme-day-head"><div><p>${entry.day}</p><h3>${entry.date}</h3></div><span>${entry.note}</span></header>
        <div class="programme-items">${entry.items.map(([time,label,type]) => `<div class="programme-item programme-${type}"><time>${time}</time><strong>${label}</strong></div>`).join('')}</div>
      </article>`).join('');
    participants.insertAdjacentHTML('afterend', `
      <section class="section programme" id="programme">
        <div class="section-kicker"><span>03</span><p>Programme</p></div>
        <div class="programme-head"><div><h2>Four days at CM4</h2></div><div class="programme-intro"><p>Ten scientific sessions are planned across the meeting. The detailed talk schedule will be added as speaker assignments are finalised.</p><p>All times are in Indian Standard Time (IST).</p></div></div>
        <div class="programme-grid" aria-label="CM4 2026 programme outline">${days}</div>
      </section>`);
    const venueNumber=document.querySelector('#venue .section-kicker span');
    const registrationNumber=document.querySelector('#registration .section-kicker span');
    const committeeNumber=document.querySelector('#committees .section-kicker span');
    if(venueNumber)venueNumber.textContent='04'; if(registrationNumber)registrationNumber.textContent='05'; if(committeeNumber)committeeNumber.textContent='06';
    const participantNav=document.querySelector('nav a[href="#participants"]');
    if(participantNav&&!document.querySelector('nav a[href="#programme"]')) participantNav.insertAdjacentHTML('afterend','<a href="#programme">Programme</a>');
  }

  const participantList = document.querySelector('#participants .person-list.featured');
  if (participantList) {
    const additions = [
      {
        name: 'Deepa Janardanan', affiliation: 'Central University of Kerala', initials: 'DJ',
        href: 'https://schools.cukerala.ac.in/Dept/Faculty_Preview?Id=53',
        photo: 'https://faculty.cukerala.ac.in/Uploads/Faculty/Profiles/394365Deepa-pic2.jpg'
      },
      {
        name: 'Radhika Gupta', affiliation: 'Aix-Marseille Université, France', initials: 'RG',
        href: 'https://ism2.univ-amu.fr/en/directory/gupta-radhika',
        photo: 'https://scholar.googleusercontent.com/citations?view_op=view_photo&user=Xcg4HSwAAAAJ&citpid=1'
      },
      {
        name: 'D. Sravanakumar Perumalla', affiliation: 'Sasi Institute of Technology & Engineering', initials: 'SP',
        href: 'https://sasi.ac.in/applied-sciences-humanities/',
        photo: 'https://scholar.googleusercontent.com/citations?view_op=view_photo&user=QzBlgRgAAAAJ&citpid=1'
      },
      {
        name: 'Upakarasamy Lourderaj', affiliation: 'NISER Bhubaneswar', initials: 'UL',
        href: 'https://www.niser.ac.in/profile/u.lourderaj',
        photo: 'https://www.niser.ac.in/assets/img/profile/u.lourderaj.jpg'
      }
    ];
    const existingNames = new Set([...participantList.querySelectorAll('.person-card h3')].map((h) => h.textContent.trim().toLocaleLowerCase()));
    additions.forEach((person) => {
      if (existingNames.has(person.name.toLocaleLowerCase())) return;
      participantList.insertAdjacentHTML('beforeend', `<a class="person-card" href="${person.href}" target="_blank" rel="noopener noreferrer"><span class="portrait"><span class="person-mark">${person.initials}</span><img class="person-photo" src="${person.photo}" alt="${person.name}" loading="lazy" decoding="async" width="480" height="600"></span><span class="person-copy"><h3>${person.name}</h3><p>${person.affiliation}</p></span><span class="profile-arrow">↗</span></a>`);
    });

    const renameParticipant = (filename, name, initials, href) => {
      const photo=participantList.querySelector(`img[src$="${filename}"]`);
      const card=photo?.closest('.person-card');
      if(!photo||!card)return;
      photo.setAttribute('alt',name);
      const heading=card.querySelector('h3'); if(heading)heading.textContent=name;
      const mark=card.querySelector('.person-mark'); if(mark)mark.textContent=initials;
      if(href&&card.matches('a')) card.setAttribute('href',href);
    };
    renameParticipant('b-kiran.webp','Kiran Boggavarapu','KB','https://www.mcneese.edu/faculty/kiran-boggavarapu-ph-d/');
    renameParticipant('t-pradeep.webp','Pradeep Thalappil','PT','https://en.wikipedia.org/wiki/Thalappil_Pradeep');

    const surnameKey = (name) => {
      const cleaned=name.replace(/\b(Jr\.?|Sr\.?|II|III|IV)\b\.?$/i,'').trim();
      const parts=cleaned.split(/\s+/);
      return parts[parts.length-1] || cleaned;
    };
    [...participantList.children].sort((a,b) => {
      const an=(a.querySelector('h3')?.textContent||'').trim();
      const bn=(b.querySelector('h3')?.textContent||'').trim();
      const bySurname=surnameKey(an).localeCompare(surnameKey(bn), 'en', {sensitivity:'base'});
      return bySurname || an.localeCompare(bn, 'en', {sensitivity:'base'});
    }).forEach((card)=>participantList.appendChild(card));
  }

  const profileLinks = {
    'odile-eisenstein.webp':'https://www.icgm.fr/odile-eisenstein/',
    'milan-kumar-jena.webp':'https://www.iitbhilai.ac.in/index.php/index.php?pid=profile_milanjena',
    'sabyasachi-mishra.webp':'https://ccds.iitkgp.ac.in/people.php',
    't-pradeep.webp':'https://en.wikipedia.org/wiki/Thalappil_Pradeep',
    'sai-g-ramesh.webp':'https://ipc.iisc.ac.in/sgr',
    'rb-sunoj.webp':'https://www.chem.iitb.ac.in/facultyuserview/r-b-sunoj',
    'jayasree-eg.webp':'https://chem.cusat.ac.in/facultymain/faculty_jayasree.html',
    'p-parameswaran.webp':'https://nitc.ac.in/department/chemistry/faculty-and-staff/faculty/62a9431e-5edc-41cf-8cf5-2b47d6889937',
    'biswarup-pathak.webp':'https://chemistry.iiti.ac.in/faculty/prof-biswarup-pathak',
    'dandamudi-usharani.webp':'https://www.cftri.res.in/index.php/faculty_detail/2370',
    'priyakumari-cp.webp':'https://www.iisermohali.ac.in/faculty/dcs/cppriyakumari',
    'naiwrit-karmodak.webp':'https://snu.edu.in/schools/school-of-natural-sciences/faculty/naiwrit-karmodak/'
  };

  document.querySelectorAll('.person-card .person-photo').forEach((photo) => {
    const filename=photo.getAttribute('src')?.split('/').pop(); const card=photo.closest('.person-card');
    if(!filename||!card)return;
    if(card.matches('a')&&profileLinks[filename]) card.setAttribute('href',profileLinks[filename]);
    if(filename==='a-sirohiwal.webp'){photo.setAttribute('alt','Abhishek Sirohiwal'); const heading=card.querySelector('h3'); if(heading)heading.textContent='Abhishek Sirohiwal';}
  });

  const travelIntro=document.querySelector('.travel-intro > p:last-child');
  if(travelIntro) travelIntro.textContent='Conference organisers will arrange pick-up and drop-off for participants from Thiruvananthapuram International Airport and Thiruvananthapuram Central railway station.';

  document.querySelectorAll('.travel-card').forEach((card)=>{
    const label=card.querySelector('.travel-label');
    if(label?.textContent.trim()==='Airport transfer'){
      label.textContent='Conference transfer';
      const heading=card.querySelector('h4'); const detail=card.querySelector('p:last-child');
      if(heading)heading.textContent='Airport and railway station pick-up / drop-off';
      if(detail)detail.textContent='Transfer arrangements will be coordinated by the conference organisers. Arrival and departure details will be collected from participants for scheduling the transfers.';
    }
  });

  const registrationSummary=document.querySelector('.registration-head > p');
  if(registrationSummary) registrationSummary.textContent='Registration is for invited participants and includes accommodation, conference materials, meals during the conference, conference dinner, the local visit / sightseeing programme, and local transfers.';

  const registration=document.querySelector('#registration');
  if(registration&&!document.querySelector('.stay-note')){
    const priceGrid=registration.querySelector('.price-grid');
    if(priceGrid) priceGrid.insertAdjacentHTML('afterend', `
      <div class="stay-note">
        <strong>Accommodation</strong>
        <p>All participants will stay at Club Mahindra Poovar during the conference period, 3–6 December 2026. Participants who require accommodation before or after the conference period should contact <a href="https://www.clubmahindra.com/resort-escapes/resort/club-mahindra-poovar-resort-in-kerala" target="_blank" rel="noopener noreferrer">Club Mahindra Poovar</a> directly for the additional stay.</p>
      </div>`);
  }

  const photoCredit=document.querySelector('.photo-credit');
  if(photoCredit) photoCredit.innerHTML='Images: <a href="https://commons.wikimedia.org/wiki/File:Poovar_Kerala.jpg" target="_blank">Midhun Subhash</a> (CC0) · <a href="https://commons.wikimedia.org/wiki/File:Poovar_Backwater.jpg" target="_blank">Deepsikder</a> (<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank">CC BY-SA 4.0</a>).';

  document.querySelectorAll('a[target="_blank"]').forEach((link)=>link.setAttribute('rel','noopener noreferrer'));
})();