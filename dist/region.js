/* A region page (dist/regions/<slug>/index.html) arrives fully written by
   tools/build_regions.mjs. This script adds what needs a browser: the photo viewer, the
   community wall and the nav colour. tip-form.js builds the tip form. */
const tips = window.GhanaTips;
const slug = document.body.dataset.region;
const regionName = (window.GHANA_REGIONS || []).find(r => r.slug === slug)?.name || '';

/* Old links (region.html?r=volta) are redirected here with their query string still on. */
if (location.search) history.replaceState(null, '', location.pathname + location.hash);

/* Site paths are root-relative: these pages live two folders down. */
const abs = src => (/^(https?:|data:|\/)/.test(src) ? src : `/${src}`);

/* Text from the data file and from submitted tips is inserted as textContent, never HTML. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

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

/* ---- Photo viewer: the gallery's full-size sources and credits are embedded in the page. ---- */
let galleryPhotos = [];
try { galleryPhotos = JSON.parse(document.querySelector('#gallery-data')?.textContent || '[]'); } catch {}

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
document.querySelectorAll('.gallery-tile[data-index]').forEach(tile => {
  tile.addEventListener('click', () => openLightbox(Number(tile.dataset.index)));
});
lightbox.querySelector('[data-close]').addEventListener('click', closeLightbox);
lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showLightbox(lightboxIndex - 1));
lightbox.querySelector('.lightbox-next').addEventListener('click', () => showLightbox(lightboxIndex + 1));
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
addEventListener('keydown', event => {
  if (lightbox.hidden) return;
  /* Keep Tab inside the open viewer instead of wandering into the page behind it. */
  if (event.key === 'Tab') {
    const stops = [...lightbox.querySelectorAll('button, a[href]')];
    const first = stops[0], last = stops[stops.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    else if (!lightbox.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
  }
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

/* ---- Community wall: real submissions for this region. ---- */
const wall = document.querySelector('#region-wall');
const communityEmpty = document.querySelector('#community-empty');

/* Published entries come from data/listings.json; this browser's own tips are shown
   alongside them, marked as waiting for review, until they come back published. */
let published = [];

/* A published listing's own photo (committed under assets/listings/), else a hosted URL. */
function listingPhoto(tip) {
  const small = tip.photos?.[0]?.small || '';
  if (/^assets\/listings\/[\w-]+\/[\w-]+\.jpg$/.test(small)) return abs(small);
  return /^https:\/\//.test(tip.photoUrl || '') && tip.photoUrl;
}

function tipTile(tip, pending) {
  /* Published tips carry a hosted photo; this browser's own pending tips a small thumbnail. */
  const photo = pending
    ? /^data:image\/jpeg;base64,/.test(tip.thumb || '') && tip.thumb
    : listingPhoto(tip);
  const tile = el('article', photo ? 'place-tile place-photo' : 'place-tile');
  if (photo) tile.style.setProperty('--image', `url("${encodeURI(photo)}")`);
  const label = el('span', null, tip.area || tip.location || tip.address || regionName);
  if (tip.category || tip.kind || !pending) label.append(el('i', tip.kind === 'Local business' ? 'kind is-business' : 'kind', tip.category || tip.kind || 'Place'));
  if (pending) label.append(el('i', 'kind is-pending', 'Waiting for review'));
  tile.append(label, el('h3', null, tip.place));
  if (tip.rating) {
    /* Google's terms: ratings shown without a Google map must say they come from Google. */
    const count = tip.reviewCount ? ` · ${Number(tip.reviewCount).toLocaleString()} reviews` : '';
    tile.append(el('p', 'tile-rating', `★ ${Number(tip.rating).toFixed(1)} on Google${count}`));
  }
  if (tip.note) tile.append(el('p', 'tile-note', tip.note));
  if (tip.submitterName) tile.append(el('p', 'tile-credit', `Suggested by ${tip.submitterName}`));
  const links = [['mapsUrl', 'Map'], ['website', 'Website'], ['phoneUrl', 'Call']].filter(([key]) => /^(https?:\/\/|tel:\+?[\d ]+$)/.test(tip[key] || ''));
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
  /* tip.niceCount is kept in the data but not shown until there are enough real votes. */
  nice.setAttribute('aria-pressed', String(!!pending));
  nice.textContent = pending ? '♥ Found it nice' : '♡ Found it nice';
  wireNice(nice);
  tile.append(nice);
  return tile;
}

function renderWall() {
  const publishedIds = new Set(published.map(tip => tip.id));
  const mine = tips.forRegion(slug).filter(tip => !publishedIds.has(tip.id));
  wall.textContent = '';
  communityEmpty.hidden = mine.length + published.length > 0;
  published.forEach(tip => wall.append(tipTile(tip, false)));
  mine.forEach(tip => wall.append(tipTile(tip, true)));
  /* Keep the grid honest: a couple of open slots read as room to contribute. */
  const invite = el('a', 'place-tile place-tip-trigger');
  invite.href = '#region-tip';
  invite.append(el('span', null, `Know somewhere in ${regionName}?`), el('strong', null, 'Put us on ↘'));
  wall.append(invite);
}

function wireNice(button) {
  button.addEventListener('click', () => {
    const pressed = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!pressed));
    button.textContent = pressed ? '♡ Found it nice' : '♥ Found it nice';
  });
}

renderWall();
tips.directory(slug)
  .then(items => { published = items.filter(item => item && item.place); renderWall(); })
  .catch(() => {});

/* The tip form (tip-form.js) files tips from this page under this region (data-region). */
document.addEventListener('ghananice:tip', event => {
  if (event.detail.tip.regionSlug === slug) renderWall();
});

const menu = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  navLinks.classList.toggle('open', !open);
});
navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu?.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('open');
}));

/* The nav is light-on-dark over the hero photograph and dark-on-paper past it. */
const heroEl = document.querySelector('.region-hero');
const navEl = document.querySelector('.nav');
const syncNav = () => navEl.classList.toggle('is-over-image', heroEl.getBoundingClientRect().bottom > 76);
let navFrame = false;
addEventListener('scroll', () => {
  if (navFrame) return;
  navFrame = true;
  requestAnimationFrame(() => {
    syncNav();
    navFrame = false;
  });
}, { passive: true });
syncNav(); /* the page can open part-way down, e.g. on #region-tip */

document.querySelector('#year').textContent = new Date().getFullYear();
