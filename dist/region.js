const regions = window.GHANA_REGIONS || [];
const tips = window.GhanaTips;

const slug = new URLSearchParams(location.search).get('r');
const region = regions.find(r => r.slug === slug) || regions[0];

/* Text from the data file and from submitted tips is inserted as textContent, never HTML. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

document.title = `${region.name} — GhanaNice`;
/* Stopgap until each region has its own static page: give crawlers that run JS a
   per-region canonical URL and description. */
const pageUrl = `https://www.ghananice.com/region.html?r=${region.slug}`;
const pageDescription = `${region.name} Region, Ghana: ${region.intro}`;
function setHead(selector, create, attr, value) {
  let node = document.head.querySelector(selector);
  if (!node) { node = create(); document.head.append(node); }
  node.setAttribute(attr, value);
}
setHead('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', pageUrl);
setHead('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' }), 'content', pageDescription);
setHead('meta[property="og:url"]', () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:url'); return m; }, 'content', pageUrl);
setHead('meta[property="og:title"]', () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:title'); return m; }, 'content', `${region.name} — GhanaNice`);
document.querySelector('#region-eyebrow').textContent = `${region.name} Region`;
document.querySelector('#region-name').textContent = region.name;
document.querySelector('#region-intro').textContent = region.intro;
document.querySelector('#fact-capital').textContent = region.capital;
document.querySelector('#fact-known').textContent = region.known;
document.querySelector('#fact-fact').textContent = region.fact;
document.querySelector('#tip-heading').innerHTML = `Know<br>somewhere in<br>${region.name}?`;

const heroImage = document.querySelector('#region-hero-image');
/* A region with a picked lead view (Accra's skyline) opens on it; the rest open on their photo. */
const leadSlug = window.GHANA_MEDIA?.leads?.[region.slug];
const leadPhoto = leadSlug && window.GHANA_MEDIA.photos[leadSlug];
const heroShot = leadPhoto ? leadPhoto.caption : region.shot;
const heroCredit = leadPhoto || window.GHANA_MEDIA?.local?.[region.image];
heroImage.src = leadPhoto ? leadPhoto.src : region.image;
heroImage.alt = heroShot;
document.querySelector('#region-hero-caption').textContent = heroCredit ? `${heroShot} · Photo: ${heroCredit.author}` : heroShot;

const media = window.GHANA_MEDIA || { photos: {}, regions: {}, places: {}, local: {} };

/* "Photo: Name · CC BY-SA 4.0", with the licence and the source page linked, as the licences ask. */
function creditLine(photo, prefix = 'Photo: ') {
  const line = el('span', 'photo-credit');
  line.append(prefix);
  const who = el('a', null, photo.author);
  who.href = photo.source;
  who.target = '_blank';
  who.rel = 'noopener';
  line.append(who, ' · ');
  if (photo.licenseUrl) {
    const lic = el('a', null, photo.license);
    lic.href = photo.licenseUrl;
    lic.target = '_blank';
    lic.rel = 'noopener license';
    line.append(lic);
  } else line.append(photo.license);
  return line;
}

/* The photographs already in the project are credited in CREDITS.md; media.js carries them too. */
function localPhoto(src) {
  const credit = media.local?.[src];
  return credit ? { src, small: src, ...credit } : null;
}

/* A card only carries a photograph when we actually have one of that specific place. */
function placeCard(item) {
  const info = media.places[`${region.slug}|${item.name}`] || {};
  const photo = item.image ? (localPhoto(item.image) || { src: item.image, small: item.image }) : media.photos[info.photo];
  const li = el('li', photo ? 'visit-item has-image' : 'visit-item');
  if (photo) {
    const figure = el('figure', 'visit-image');
    const img = el('img');
    img.src = photo.small;
    img.alt = photo.caption || item.name;
    img.loading = 'lazy';
    figure.append(img);
    if (photo.author) figure.append(creditLine(photo, ''));
    li.append(figure);
  }
  const body = el('div', 'visit-body');
  body.append(el('h3', null, item.name), el('p', null, item.note));
  const links = [['site', 'Official site'], ['guide', 'Visit Ghana guide'], ['wiki', 'Wikipedia']].filter(([key]) => info[key]);
  if (links.length) {
    const row = el('p', 'visit-links');
    links.forEach(([key, label]) => {
      const a = el('a', null, `${label} ↗`);
      a.href = info[key];
      a.target = '_blank';
      a.rel = 'noopener';
      row.append(a);
    });
    body.append(row);
  }
  li.append(body);
  return li;
}

const visitList = document.querySelector('#visit-list');
region.visit.forEach(item => visitList.append(placeCard(item)));

/* Gallery: an editorial mosaic. Wide photos span two columns, tall ones two rows, and the
   first photo leads large. The last tile asks for photos. */
/* Most regions open on their hero photograph; a few lead with a stronger picked view
   (Accra's skyline, Kumasi's Kejetia) and put the hero photos after it. */
const regionPhotos = (media.regions[region.slug] || []).map(slug => media.photos[slug]).filter(Boolean);
const heroPhotos = [region.image, region.side].filter(Boolean).map(localPhoto).filter(Boolean);
const leadsWithPick = !!media.leads?.[region.slug];
const galleryPhotos = leadsWithPick
  ? [...regionPhotos.slice(0, 1), ...heroPhotos, ...regionPhotos.slice(1)]
  : [...heroPhotos, ...regionPhotos];
const galleryGrid = document.querySelector('#gallery-grid');
document.querySelector('#gallery-region').textContent = `${region.name}.`;

galleryPhotos.forEach((photo, index) => {
  const ratio = (photo.w || 4) / (photo.h || 3);
  const shape = index === 0 ? 'is-lead' : ratio > 1.7 ? 'is-wide' : ratio < .85 ? 'is-tall' : '';
  const tile = el('button', `gallery-tile ${shape}`.trim());
  tile.type = 'button';
  tile.setAttribute('aria-label', `View photo: ${photo.caption}`);
  const img = el('img');
  img.src = photo.small;
  img.alt = photo.caption;
  img.loading = index < 3 ? 'eager' : 'lazy';
  img.decoding = 'async';
  const label = el('span', 'gallery-label');
  label.append(el('b', null, photo.caption), el('small', null, `by ${photo.author}`));
  tile.append(img, label);
  tile.addEventListener('click', () => openLightbox(index));
  galleryGrid.append(tile);
});
const invite = el('a', 'gallery-tile gallery-invite');
invite.href = '#region-tip';
invite.append(el('span', null, `Been to ${region.name}?`), el('strong', null, 'Add your photo ↘'), el('small', null, 'Help show the world why Ghana is nice. We credit every photographer.'));
galleryGrid.append(invite);

const creditList = document.querySelector('#gallery-credits');
galleryPhotos.forEach(photo => {
  const li = el('li');
  li.append(el('span', null, `${photo.caption}. `), creditLine(photo, ''));
  creditList.append(li);
});

const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
let lightboxIndex = 0;
let lightboxTrigger = null;
function showLightbox(index) {
  lightboxIndex = (index + galleryPhotos.length) % galleryPhotos.length;
  const photo = galleryPhotos[lightboxIndex];
  lightboxImage.src = photo.src;
  lightboxImage.alt = photo.caption;
  document.querySelector('#lightbox-caption').textContent = photo.caption;
  const credit = document.querySelector('#lightbox-credit');
  credit.textContent = '';
  credit.append(creditLine(photo));
  document.querySelector('#lightbox-count').textContent = `${lightboxIndex + 1} / ${galleryPhotos.length}`;
}
function openLightbox(index) {
  lightboxTrigger = document.activeElement;
  showLightbox(index);
  lightbox.hidden = false;
  document.body.classList.add('has-lightbox');
  lightbox.querySelector('[data-close]').focus();
}
function closeLightbox() {
  lightbox.hidden = true;
  document.body.classList.remove('has-lightbox');
  lightboxTrigger?.focus();
}
lightbox.querySelector('[data-close]').addEventListener('click', closeLightbox);
lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showLightbox(lightboxIndex - 1));
lightbox.querySelector('.lightbox-next').addEventListener('click', () => showLightbox(lightboxIndex + 1));
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
addEventListener('keydown', event => {
  if (lightbox.hidden) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') showLightbox(lightboxIndex - 1);
  if (event.key === 'ArrowRight') showLightbox(lightboxIndex + 1);
});
/* Swipe between photos on touch screens. */
let touchStartX = null;
lightbox.addEventListener('touchstart', event => { touchStartX = event.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', event => {
  if (touchStartX === null) return;
  const dx = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) showLightbox(lightboxIndex + (dx < 0 ? 1 : -1));
  touchStartX = null;
});

const businessList = document.querySelector('#business-list');
const businessEmpty = document.querySelector('#business-empty');
if (region.businesses.length) region.businesses.forEach(item => businessList.append(placeCard(item)));
else businessEmpty.hidden = false;

/* Community wall: real submissions for this region, read back out of this browser. */
const wall = document.querySelector('#region-wall');
const communityEmpty = document.querySelector('#community-empty');

/* Published entries come from the n8n directory; this browser's own tips are shown
   alongside them, marked as waiting for review, until they come back published. */
let published = [];

function tipTile(tip, pending) {
  const photo = !pending && /^https:\/\//.test(tip.photoUrl || '') && tip.photoUrl;
  const tile = el('article', photo ? 'place-tile place-photo' : 'place-tile');
  if (photo) tile.style.setProperty('--image', `url("${encodeURI(tip.photoUrl)}")`);
  const label = el('span', null, tip.location || tip.address || region.name);
  label.append(el('i', tip.kind === 'Local business' ? 'kind is-business' : 'kind', tip.kind || 'Place'));
  if (pending) label.append(el('i', 'kind is-pending', 'Waiting for review'));
  tile.append(label, el('h3', null, tip.place));
  if (tip.rating) {
    const count = tip.reviewCount ? ` · ${Number(tip.reviewCount).toLocaleString()} Google reviews` : '';
    tile.append(el('p', 'tile-rating', `★ ${Number(tip.rating).toFixed(1)}${count}`));
  }
  if (tip.note) tile.append(el('p', 'tile-note', tip.note));
  if (tip.submitterName) tile.append(el('p', 'tile-credit', `Suggested by ${tip.submitterName}`));
  const links = [['mapsUrl', 'Map'], ['website', 'Website']].filter(([key]) => /^https?:\/\//.test(tip[key] || ''));
  if (links.length) {
    const row = el('p', 'tile-links');
    links.forEach(([key, text]) => {
      const a = el('a', null, `${text} ↗`);
      a.href = tip[key];
      a.target = '_blank';
      a.rel = 'noopener nofollow';
      row.append(a);
    });
    tile.append(row);
  }
  const nice = el('button', 'nice-button');
  nice.type = 'button';
  nice.dataset.count = String(tip.niceCount || (pending ? 1 : 0));
  nice.setAttribute('aria-pressed', String(!!pending));
  nice.append(document.createTextNode(pending ? '♥ ' : '♡ '), el('b', null, nice.dataset.count), document.createTextNode(' found it nice'));
  wireNice(nice);
  tile.append(nice);
  return tile;
}

function renderWall() {
  const publishedIds = new Set(published.map(tip => tip.id));
  const mine = tips.forRegion(region.slug).filter(tip => !publishedIds.has(tip.id));
  wall.textContent = '';
  communityEmpty.hidden = mine.length + published.length > 0;
  published.forEach(tip => wall.append(tipTile(tip, false)));
  mine.forEach(tip => wall.append(tipTile(tip, true)));
  /* Keep the grid honest: a couple of open slots read as room to contribute. */
  const invite = el('a', 'place-tile place-tip-trigger');
  invite.href = '#region-tip';
  invite.append(el('span', null, `Know somewhere in ${region.name}?`), el('strong', null, 'Put us on ↘'));
  wall.append(invite);
}

function wireNice(button) {
  button.addEventListener('click', () => {
    const pressed = button.getAttribute('aria-pressed') === 'true';
    const base = Number(button.dataset.count || 0);
    button.setAttribute('aria-pressed', String(!pressed));
    button.firstChild.textContent = pressed ? '♡ ' : '♥ ';
    button.querySelector('b').textContent = String(base + (pressed ? 0 : 1));
  });
}

renderWall();
tips.directory(region.slug)
  .then(items => { published = items.filter(item => item && item.place); renderWall(); })
  .catch(() => {});

const regionSelect = document.querySelector('#region-select');
regions.forEach(r => {
  const option = el('option', null, r.name);
  option.value = r.slug;
  if (r.slug === region.slug) option.selected = true;
  regionSelect.append(option);
});

const form = document.querySelector('#region-form');
const status = document.querySelector('#region-form-status');
tips.labelForms();
form.addEventListener('submit', async event => {
  event.preventDefault();
  const tip = tips.fromForm(form, region.slug);
  const { place } = tip;
  if (!place) return;
  const chosen = tip.regionSlug;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.textContent = 'Sending…';
  let result;
  try {
    result = await tips.submit(tip);
  } catch {
    status.textContent = 'That didn’t go through. Check your connection and try again — nothing was lost.';
    button.disabled = false;
    return;
  }
  button.disabled = false;
  form.reset();
  regionSelect.value = region.slug;
  const firstName = tip.submitter.name.split(/\s+/)[0];
  const name = (regions.find(r => r.slug === chosen) || region).name;
  if (result.live) {
    if (chosen === region.slug) renderWall();
    status.textContent = `Thanks, ${firstName} — “${place}” is in. Check your inbox for a note from us; it joins the ${name} directory once we’ve looked it up.`;
    return;
  }
  if (!result.ok) {
    status.textContent = 'Could not save — this browser is blocking local storage.';
    return;
  }
  if (chosen === region.slug) {
    renderWall();
    status.textContent = `Thanks, ${firstName} — “${place}” is on the wall below (in this browser).`;
  } else {
    status.textContent = `Thanks, ${firstName} — “${place}” was added to ${name} (in this browser).`;
  }
});

const nextLinks = document.querySelector('#region-next-links');
const index = regions.indexOf(region);
[regions[(index + 1) % regions.length], regions[(index + 2) % regions.length]].forEach(r => {
  const link = el('a', null, r.name);
  link.href = `region.html?r=${r.slug}`;
  nextLinks.append(link);
});

const menu = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  navLinks.classList.toggle('open', !open);
});

/* The nav is light-on-dark over the hero photograph and dark-on-paper past it. */
const heroEl = document.querySelector('.region-hero');
const navEl = document.querySelector('.nav');
addEventListener('scroll', () => {
  navEl.classList.toggle('is-over-image', heroEl.getBoundingClientRect().bottom > 76);
}, { passive: true });

document.querySelector('#year').textContent = new Date().getFullYear();
