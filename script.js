// Render editable content from content/site.json (edited via /admin CMS).
// If the fetch fails for any reason, the static text already in the HTML
// stays as-is — this is progressive enhancement, not a hard dependency.
async function renderSiteContent() {
  let data;
  try {
    const res = await fetch('/content/site.json', { cache: 'no-store' });
    if (!res.ok) return;
    data = await res.json();
  } catch (e) {
    return;
  }

  const getPath = (obj, path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);

  // Simple top-level fields anywhere on the page: hero.*, etc.
  document.querySelectorAll('[data-field^="hero."]').forEach((el) => {
    const field = el.getAttribute('data-field');
    const value = getPath(data, field);
    if (value !== undefined) el.textContent = value;
  });

  // Stat strip (4 fixed slots, in order)
  const statStrip = document.getElementById('stat-strip');
  if (statStrip && Array.isArray(data.stats)) {
    const statEls = statStrip.querySelectorAll('.stat');
    statEls.forEach((el, i) => {
      const stat = data.stats[i];
      if (!stat) return;
      const b = el.querySelector('b');
      const span = el.querySelector('span');
      if (b) b.textContent = stat.value;
      if (span) span.textContent = stat.label;
    });
  }

  // Any camp card / detail block: match by data-camp="<id>" against data.camps
  if (Array.isArray(data.camps)) {
    document.querySelectorAll('[data-camp]').forEach((card) => {
      const campId = card.getAttribute('data-camp');
      const camp = data.camps.find((c) => c.id === campId);
      if (!camp) return;
      card.querySelectorAll('[data-field]').forEach((el) => {
        const field = el.getAttribute('data-field');
        const value = camp[field];
        if (value === undefined) return;
        if (field === 'description') {
          el.innerHTML = value.split('\n\n').join('<br><br>');
        } else {
          el.textContent = value;
        }
      });
    });
  }

  // Staff groups: fully regenerated from data.staff_groups
  const staffContainer = document.getElementById('staff-groups');
  if (staffContainer && Array.isArray(data.staff_groups)) {
    const jerseyLabel = (role) => {
      const r = (role || '').toLowerCase();
      if (r.includes('coach')) return 'Coach';
      if (r.includes('prépar')) return 'Prépa. physique';
      return 'Staff';
    };
    staffContainer.innerHTML = data.staff_groups.map((group) => `
      <div class="staff-group">
        <h3>${group.name} <span class="count">${group.members.length} membres</span></h3>
        <div class="staff-grid">
          ${group.members.map((m) => `
            <div class="staff-card">
              <span class="jersey">${jerseyLabel(m.role)}</span>
              <h4>${m.name}</h4>
              <p class="role">${m.role}</p>
              ${m.instagram ? `<a class="ig" href="${m.instagram}" target="_blank" rel="noopener">Instagram →</a>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }
}

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  renderSiteContent();

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Registration form: client-side validation + confirmation state.
  // NOTE for 4D Elite: this demo intercepts submission locally so the page
  // has something to show. To actually receive inscriptions, connect the
  // <form id="inscription-form"> to a form backend (Formspree, Netlify
  // Forms...) — see the comment near the <form> tag in inscription.html.
  const form = document.getElementById('inscription-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      const campChosen = form.querySelector('input[name="camp"]:checked');
      if (!campChosen) {
        e.preventDefault();
        alert('Merci de choisir un camp avant de valider.');
        return;
      }
      // If the form action is still the placeholder, do a local demo submit
      if (form.getAttribute('action')?.includes('YOUR_FORM_ID')) {
        e.preventDefault();
        form.style.display = 'none';
        document.getElementById('confirm-msg').style.display = 'block';
        window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
      }
      // otherwise let it submit normally to the configured backend
    });
  }
});
