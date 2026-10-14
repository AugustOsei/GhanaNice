(async function initTravelDirectory() {
const seededServices = Array.isArray(window.GHANA_TRAVEL_SERVICES) ? window.GHANA_TRAVEL_SERVICES : [];
let services = [...seededServices];
try {
  const response = await fetch('data/service-submissions.json', { cache: 'no-cache' });
  if (response.ok) {
    const body = await response.json();
    const published = Array.isArray(body.services) ? body.services : [];
    const seededIds = new Set(seededServices.map(service => service.id));
    services = [...seededServices, ...published.filter(service => service?.id && !seededIds.has(service.id))];
  }
} catch {
  // The curated directory remains usable if the published-submissions file is unavailable.
}
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

function officialUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '#';
  } catch {
    return '#';
  }
}

const categoryNames = {
  all: 'services',
  tours: 'tours and guides',
  transport: 'transport services',
  stay: 'places to stay',
};

function dataAttributes(service) {
  return `data-category="${escapeHTML(service.category)}" data-regions="${escapeHTML(service.regions.join(' '))}"`;
}

function tagsMarkup(service) {
  return service.goodFor.map(item => `<li>${escapeHTML(item)}</li>`).join('');
}

function imageMarkup(image, sizes, loading = 'lazy') {
  if (!image) return '';
  const srcset = image.srcset ? ` srcset="${escapeHTML(image.srcset)}"` : '';
  return `<img src="${escapeHTML(image.src)}"${srcset} sizes="${escapeHTML(sizes)}" alt="${escapeHTML(image.alt)}" loading="${loading}" decoding="async">`;
}

function shuffled(items) {
  const result = [...items];
  const random = () => {
    if (!crypto?.getRandomValues) return Math.random();
    return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function primeMarkup(service) {
  const cover = service.media?.[0];
  return `<article class="prime-card" ${dataAttributes(service)}>
    <button class="prime-cover" type="button" data-profile="${escapeHTML(service.id)}" aria-label="Open featured profile for ${escapeHTML(service.name)}">
      ${imageMarkup(cover, '(max-width: 760px) 45vw, 24vw')}
      <span class="prime-badge">Featured preview</span>
    </button>
    <div class="prime-card-body">
      <p class="prime-meta"><span class="category-tab category-tab--${escapeHTML(service.category)}">${escapeHTML(service.categoryLabel)}</span><span>${escapeHTML(service.base)}</span></p>
      <h4>${escapeHTML(service.name)}</h4>
    </div>
    <footer class="prime-card-footer">
      <button class="profile-button" type="button" data-profile="${escapeHTML(service.id)}" aria-label="View full profile for ${escapeHTML(service.name)}">Profile</button>
      <button class="share-button" type="button" data-share="${escapeHTML(service.id)}">Share<span class="sr-only"> ${escapeHTML(service.name)}</span></button>
    </footer>
  </article>`;
}

function rowMarkup(service) {
  return `<article class="service-row" id="service-${escapeHTML(service.id)}" ${dataAttributes(service)}>
    <header class="service-row-heading">
      <p><span class="category-tab category-tab--${escapeHTML(service.category)}">${escapeHTML(service.categoryLabel)}</span></p>
      <h4>${escapeHTML(service.name)}</h4>
      <p>${escapeHTML(service.base)}</p>
    </header>
    <div class="service-row-copy">
      <p>${escapeHTML(service.description)}</p>
      <ul class="service-tags" aria-label="Useful for">${tagsMarkup(service)}</ul>
      <div class="service-row-actions">
        <div class="service-row-links">
          <a class="official-link" href="${officialUrl(service.website)}" target="_blank" rel="noopener">Link<span class="sr-only"> to ${escapeHTML(service.name)}</span></a>
          <button class="share-button" type="button" data-share="${escapeHTML(service.id)}">Share<span class="sr-only"> ${escapeHTML(service.name)}</span></button>
        </div>
      </div>
    </div>
  </article>`;
}

const primeGrid = document.querySelector('#prime-grid');
const serviceList = document.querySelector('#service-list');
const featuredServices = shuffled(services.filter(service => service.featured));
if (primeGrid) primeGrid.innerHTML = featuredServices.map(primeMarkup).join('');
if (serviceList) serviceList.innerHTML = services.map(rowMarkup).join('');

const primeCards = [...document.querySelectorAll('.prime-card')];
const serviceRows = [...document.querySelectorAll('.service-row')];
const featuredCount = document.querySelector('#featured-count');
const featuredPageLabel = document.querySelector('#featured-page');
const featuredPrev = document.querySelector('#featured-prev');
const featuredNext = document.querySelector('#featured-next');
const featuredRailBar = document.querySelector('#featured-rail-bar');
const mobileFeaturedQuery = matchMedia('(max-width: 760px)');
let featuredPage = 0;
let matchingFeaturedCards = [...primeCards];

function featuredPageSize() {
  return mobileFeaturedQuery.matches ? 2 : 4;
}

function renderFeaturedPage() {
  const pageSize = featuredPageSize();
  const pageTotal = Math.max(1, Math.ceil(matchingFeaturedCards.length / pageSize));
  featuredPage = Math.min(featuredPage, pageTotal - 1);
  const firstIndex = featuredPage * pageSize;
  const pageCards = new Set(matchingFeaturedCards.slice(firstIndex, firstIndex + pageSize));
  primeCards.forEach(card => { card.hidden = !pageCards.has(card); });
  if (featuredCount) featuredCount.textContent = String(matchingFeaturedCards.length).padStart(2, '0');
  if (featuredPageLabel) featuredPageLabel.textContent = `Page ${featuredPage + 1} of ${pageTotal}`;
  if (featuredPrev) featuredPrev.disabled = featuredPage === 0;
  if (featuredNext) featuredNext.disabled = featuredPage >= pageTotal - 1;
  /* A count and paging buttons only earn their place once there is a second page. */
  if (featuredRailBar) featuredRailBar.hidden = pageTotal <= 1;
}

featuredPrev?.addEventListener('click', () => { featuredPage -= 1; renderFeaturedPage(); });
featuredNext?.addEventListener('click', () => { featuredPage += 1; renderFeaturedPage(); });
mobileFeaturedQuery.addEventListener('change', () => { featuredPage = 0; renderFeaturedPage(); });

const profileDialog = document.querySelector('#featured-profile');
const profileContent = document.querySelector('#featured-profile-content');
const profileClose = document.querySelector('.profile-close');

function profileMarkup(service) {
  const gallery = (service.media || []).map(image => `<figure>
    ${imageMarkup(image, '(max-width: 760px) calc(100vw - 68px), 42vw', 'eager')}
    <figcaption><a href="${officialUrl(image.source)}" target="_blank" rel="noopener">${escapeHTML(image.credit)}</a></figcaption>
  </figure>`).join('');
  return `<div class="profile-gallery">${gallery}</div>
    <div class="profile-copy">
      <p class="profile-label">Featured business · ${escapeHTML(service.categoryLabel)}</p>
      <h2 id="profile-name">${escapeHTML(service.name)}</h2>
      <p class="profile-intro">${escapeHTML(service.profileIntro || service.description)}</p>
      <div class="profile-facts">
        <p><strong>Based</strong>${escapeHTML(service.base)}</p>
        <p><strong>Where they work</strong>${escapeHTML(service.coverage)}</p>
        <p><strong>Useful for</strong>${escapeHTML(service.goodFor.join(' · '))}</p>
      </div>
      <p class="profile-check">Confirm current services, prices and availability directly with the business.</p>
      <div class="profile-actions">
        <a class="profile-site" href="${officialUrl(service.website)}" target="_blank" rel="noopener">Link<span class="sr-only"> to ${escapeHTML(service.name)}</span></a>
        <button class="share-button" type="button" data-share="${escapeHTML(service.id)}">Share this business</button>
      </div>
    </div>`;
}

function openProfile(id) {
  const service = featuredServices.find(item => item.id === id);
  if (!service || !profileDialog || !profileContent) return;
  profileContent.innerHTML = profileMarkup(service);
  profileDialog.showModal();
}

document.querySelectorAll('[data-profile]').forEach(button => button.addEventListener('click', () => openProfile(button.dataset.profile)));
profileClose?.addEventListener('click', () => profileDialog.close());
profileDialog?.addEventListener('click', event => {
  if (event.target === profileDialog) profileDialog.close();
});

const regionSelect = document.querySelector('#directory-region');
const categorySelect = document.querySelector('#directory-category');
const status = document.querySelector('#directory-status');
const emptyState = document.querySelector('#directory-empty');
const primeSection = document.querySelector('.prime-listings');
const allSection = document.querySelector('.all-listings');
/* Only the three category cards: the listings carry data-category too, for filtering. */
const needButtons = [...document.querySelectorAll('.need-card[data-category]')];
let activeCategory = 'all';

function matchesFilters(element, region) {
  const matchesCategory = activeCategory === 'all' || element.dataset.category === activeCategory;
  const regions = element.dataset.regions.split(' ');
  const matchesRegion = !region || regions.includes('all') || regions.includes(region);
  return matchesCategory && matchesRegion;
}

function applyFilters() {
  const region = regionSelect?.value || '';
  let visibleServices = 0;

  serviceRows.forEach(row => {
    const show = matchesFilters(row, region);
    row.hidden = !show;
    if (show) visibleServices += 1;
  });
  matchingFeaturedCards = primeCards.filter(card => matchesFilters(card, region));
  featuredPage = 0;
  renderFeaturedPage();

  if (primeSection) primeSection.hidden = matchingFeaturedCards.length === 0;
  if (allSection) allSection.hidden = visibleServices === 0;
  if (emptyState) emptyState.hidden = visibleServices !== 0;
  const label = activeCategory === 'all' ? categoryNames.all : categoryNames[activeCategory];
  if (status) status.textContent = visibleServices === 1 ? 'Showing 1 service' : `Showing ${visibleServices} ${label}`;
}

function setCategory(category) {
  activeCategory = category;
  if (categorySelect) categorySelect.value = category;
  needButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
  applyFilters();
}

/* The cards and the Category menu stay in step. A second press on the active card returns
   to every service. */
needButtons.forEach(button => button.addEventListener('click', () => {
  const next = activeCategory === button.dataset.category ? 'all' : button.dataset.category;
  setCategory(next);
  if (next !== 'all') document.querySelector('#directory')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}));
regionSelect?.addEventListener('change', applyFilters);
categorySelect?.addEventListener('change', () => setCategory(categorySelect.value));

function resetDirectory() {
  if (regionSelect) regionSelect.value = '';
  setCategory('all');
}

/* Hero: a single pencil line. It is one list of points that is either a ball of yarn or one
   of three drawings sampled from the hidden .hero-source paths. To change drawing the line
   winds up into a ball of yarn and unwinds into the next shape, one end leading the other like
   a rope. The drawings take turns; pointing at or focusing a headline word holds its drawing,
   and choosing a word filters the directory by that category. */
const heroWords = [...document.querySelectorAll('.hero-word')];
const heroStage = document.querySelector('.travel-hero-stage');
const heroRopes = [...document.querySelectorAll('.hero-rope')];
const heroExtras = [...document.querySelectorAll('.hero-extra')];
const heroGrain = [...document.querySelectorAll('.hero-scene feTurbulence')];
const ROPE_POINTS = 440;
const ROPE_MS = 2100;
const heroShapes = {};
document.querySelectorAll('.hero-source').forEach(source => {
  const [scale, dx, dy] = source.dataset.fit.split(',').map(Number);
  const length = source.getTotalLength();
  heroShapes[source.dataset.icon] = Array.from({ length: ROPE_POINTS }, (_, index) => {
    const point = source.getPointAtLength(length * index / (ROPE_POINTS - 1));
    return [point.x * scale + dx, point.y * scale + dy];
  });
});

/* A ball of yarn: the line is wound round and round a circle, each turn tilted a little
   from the last, with a short loose end trailing off. The winding starts from a different
   angle every time. */
function ropeTangle() {
  const turn = Math.PI * 2;
  const windings = 11;
  const radius = 50;
  const spin = Math.random() * turn;
  const lean = Math.random() * turn;
  const tail = .06;
  return Array.from({ length: ROPE_POINTS }, (_, index) => {
    const t = index / (ROPE_POINTS - 1);
    if (t > 1 - tail) {
      /* The loose end leaves the ball and curls away to the lower right. */
      const out = (t - (1 - tail)) / tail;
      return [120 + radius * .72 + 38 * out, 88 + radius * .66 + 9 * Math.sin(out * Math.PI * 1.4) + 6 * out];
    }
    const wind = t / (1 - tail);
    const around = turn * windings * wind;
    const angle = spin + Math.PI * 1.25 * wind;
    const tilt = .22 + .78 * Math.abs(Math.sin(lean + Math.PI * 1.6 * wind));
    const across = radius * Math.cos(around);
    const along = radius * Math.sin(around) * tilt;
    return [
      120 + across * Math.cos(angle) - along * Math.sin(angle),
      88 + across * Math.sin(angle) + along * Math.cos(angle),
    ];
  });
}

function drawRope(points) {
  const d = `M${points.map(point => `${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join('L')}`;
  heroRopes.forEach(rope => rope.setAttribute('d', d));
}

const unit = value => Math.min(1, Math.max(0, value));
const easeRope = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let ropePoints = ropeTangle();
let ropeFrame = 0;
let heroCategory = '';
let heroIndex = 0;
let heroTimer = 0;
let heroBoil = 0;
let heroHeld = false;
let heroInView = true;
let heroArmed = null;
let heroPointer = '';

function showHeroExtras(category) {
  heroExtras.forEach(extra => extra.classList.toggle('is-shown', extra.dataset.icon === category));
}

function ropeTo(category) {
  const target = heroShapes[category];
  if (!target || category === heroCategory) return;
  heroCategory = category;
  heroWords.forEach(word => word.classList.toggle('is-active', word.dataset.heroCategory === category));
  cancelAnimationFrame(ropeFrame);
  showHeroExtras('');
  if (reducedMotion) {
    ropePoints = target;
    drawRope(target);
    showHeroExtras(category);
    return;
  }
  const from = ropePoints.map(point => [...point]);
  const knot = ropeTangle();
  const start = performance.now();
  const step = now => {
    const t = unit((now - start) / ROPE_MS);
    ropePoints = target.map((end, index) => {
      const lag = index / ROPE_POINTS * .3;
      /* Let go quickly, stay tangled for a beat, then gather. */
      const loosen = easeRope(unit((t * 1.3 - lag) / .36));
      const gather = easeRope(unit((t * 1.3 - lag - .52) / .48));
      const x = from[index][0] + (knot[index][0] - from[index][0]) * loosen;
      const y = from[index][1] + (knot[index][1] - from[index][1]) * loosen;
      return [x + (end[0] - x) * gather, y + (end[1] - y) * gather];
    });
    drawRope(ropePoints);
    if (t < 1) ropeFrame = requestAnimationFrame(step);
    else showHeroExtras(category);
  };
  ropeFrame = requestAnimationFrame(step);
}

function runHero() {
  clearInterval(heroTimer);
  clearInterval(heroBoil);
  if (reducedMotion || !heroInView) return;
  /* The slight shiver of a hand-drawn line: reseed the pencil grain a few times a second. */
  heroBoil = setInterval(() => {
    if (!document.hidden) heroGrain.forEach(grain => grain.setAttribute('seed', String(1 + Math.floor(Math.random() * 90))));
  }, 170);
  if (heroHeld || heroWords.length < 2) return;
  heroTimer = setInterval(() => {
    if (document.hidden) return;
    heroIndex = (heroIndex + 1) % heroWords.length;
    ropeTo(heroWords[heroIndex].dataset.heroCategory);
  }, 5200);
}

heroWords.forEach((word, index) => {
  const hold = () => { heroHeld = true; heroIndex = index; ropeTo(word.dataset.heroCategory); runHero(); };
  const release = () => { heroHeld = false; runHero(); };
  word.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') hold(); });
  word.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') release(); });
  word.addEventListener('focus', hold);
  word.addEventListener('blur', () => { if (heroArmed !== word) release(); });
  word.addEventListener('pointerdown', event => { heroPointer = event.pointerType; });
  word.addEventListener('click', event => {
    event.preventDefault();
    /* Touch has no hover, so the first tap shows the word's drawing and the second goes to
       its services, like the region cards on the home page. Mouse and keyboard go at once. */
    const touch = heroPointer === 'touch' || heroPointer === 'pen';
    heroPointer = '';
    if (touch && event.detail !== 0 && heroArmed !== word) {
      heroArmed = word;
      hold();
      return;
    }
    heroArmed = null;
    setCategory(word.dataset.heroCategory);
    document.querySelector('#directory')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
});
/* A tap anywhere else lets the drawings take turns again. */
document.addEventListener('pointerdown', event => {
  if (!heroArmed || event.target.closest?.('.hero-word')) return;
  heroArmed = null;
  heroHeld = false;
  runHero();
});
if (heroWords.length && heroStage && heroRopes.length) {
  drawRope(ropePoints);
  ropeTo(heroWords[0].dataset.heroCategory);
  const heroSection = document.querySelector('.travel-hero');
  if (heroSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => { heroInView = entries[0].isIntersecting; runHero(); }).observe(heroSection);
  } else {
    runHero();
  }
}

document.querySelector('#directory-reset')?.addEventListener('click', resetDirectory);
document.querySelector('#directory-empty-reset')?.addEventListener('click', resetDirectory);

const shareStatus = document.querySelector('#share-status');

function serviceShareUrl(service) {
  const url = new URL(location.href);
  url.searchParams.set('business', service.id);
  url.hash = `service-${service.id}`;
  return url.href;
}

async function copyShareLink(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.append(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

async function shareService(service, button) {
  const url = serviceShareUrl(service);
  try {
    if (navigator.share) {
      await navigator.share({
        title: `${service.name} — GhanaNice`,
        text: `${service.name} in the GhanaNice travel directory.`,
        url,
      });
      if (shareStatus) shareStatus.textContent = `${service.name} shared.`;
      return;
    }
    await copyShareLink(url);
    if (shareStatus) shareStatus.textContent = `Link to ${service.name} copied.`;
    const original = button.firstChild?.textContent || 'Share';
    if (button.firstChild) button.firstChild.textContent = 'Copied';
    setTimeout(() => { if (button.firstChild) button.firstChild.textContent = original; }, 1800);
  } catch (error) {
    if (error?.name !== 'AbortError' && shareStatus) shareStatus.textContent = 'The link could not be shared. Please try again.';
  }
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-share]');
  if (!button) return;
  const service = services.find(item => item.id === button.dataset.share);
  if (service) shareService(service, button);
});

const menu = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
const nav = document.querySelector('.nav');
const hero = document.querySelector('.travel-hero');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  navLinks?.classList.toggle('open', !open);
});
navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu?.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('open');
}));

let navFrame = 0;
function updateNav() {
  navFrame = 0;
  if (!nav || !hero) return;
  nav.classList.toggle('is-over-image', scrollY < hero.offsetHeight - 76);
}
addEventListener('scroll', () => {
  if (!navFrame) navFrame = requestAnimationFrame(updateNav);
}, { passive: true });
updateNav();

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

/* Service submissions use a separate endpoint because place tips follow a different review
   contract. With no endpoint configured, the form honestly saves a browser-only draft. */
const serviceForm = document.querySelector('#service-form');
const submitButton = document.querySelector('#service-submit-button');
const formNote = document.querySelector('#service-form-note');
const formStatus = document.querySelector('#service-form-status');
const submissionEndpoint = window.GHANANICE_CONFIG?.serviceSubmissionEndpoint || '';

if (!submissionEndpoint && submitButton && formNote) {
  submitButton.querySelector('span').textContent = 'Save a draft';
  formNote.textContent = 'Preview mode: this draft stays in this browser until the business-review pipeline is connected.';
}

serviceForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!serviceForm.reportValidity()) return;

  const values = new FormData(serviceForm);
  const payload = {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    submittedAt: new Date().toISOString(),
    businessName: String(values.get('businessName') || '').trim(),
    category: String(values.get('category') || '').trim(),
    baseLocation: String(values.get('baseLocation') || '').trim(),
    primaryRegion: String(values.get('primaryRegion') || '').trim(),
    website: String(values.get('website') || '').trim(),
    coverage: String(values.get('coverage') || '').trim(),
    description: String(values.get('description') || '').trim(),
    listingType: String(values.get('listingType') || 'standard'),
    contactName: String(values.get('contactName') || '').trim(),
    email: String(values.get('email') || '').trim(),
    phone: String(values.get('phone') || '').trim(),
    companyFax: String(values.get('companyFax') || '').trim(),
    consent: values.get('consent') === 'on',
    source: 'travel-directory.html',
    pageUrl: location.href,
  };

  submitButton.disabled = true;
  if (formStatus) formStatus.textContent = submissionEndpoint ? 'Sending your service for review…' : 'Saving your draft…';
  try {
    if (submissionEndpoint) {
      const response = await fetch(submissionEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Submission failed with ${response.status}`);
      if (formStatus) formStatus.textContent = 'Thanks — your service is in the review queue. Nothing is published automatically.';
      serviceForm.reset();
    } else {
      const storageKey = 'ghanaNiceTravelServiceDrafts';
      const drafts = JSON.parse(localStorage.getItem(storageKey) || '[]');
      drafts.push(payload);
      localStorage.setItem(storageKey, JSON.stringify(drafts.slice(-10)));
      if (formStatus) formStatus.textContent = 'Draft saved in this browser. Connect the review endpoint before launching submissions.';
    }
  } catch {
    if (formStatus) formStatus.textContent = 'That did not go through. Keep the details here and try again later.';
  } finally {
    submitButton.disabled = false;
  }
});

applyFilters();

/* The home page links here with ?category=tours|transport|stay: open already filtered. */
const requestedCategory = new URLSearchParams(location.search).get('category');
if (requestedCategory && requestedCategory !== 'all' && categoryNames[requestedCategory]) {
  setCategory(requestedCategory);
  requestAnimationFrame(() => document.querySelector('#directory')?.scrollIntoView({ block: 'start' }));
}

const requestedBusiness = new URLSearchParams(location.search).get('business');
if (requestedBusiness) {
  const requestedService = services.find(service => service.id === requestedBusiness);
  if (requestedService?.featured) {
    openProfile(requestedBusiness);
  } else {
    requestAnimationFrame(() => document.getElementById(`service-${requestedBusiness}`)?.scrollIntoView({ block: 'center' }));
  }
}
})();
