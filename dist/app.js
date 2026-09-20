const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const regions = window.GHANA_REGIONS;
const tipStore = window.GhanaTips;

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

/* A vertical reel: fast changes first, then increasingly long holds before it settles. */
const heroWindow = document.querySelector('#hero-window');
const heroVideo = document.querySelector('#hero-video');
const scenes = [...document.querySelectorAll('.map-scene')];
const sequenceCount = document.querySelector('#sequence-count');
const sequenceName = document.querySelector('#sequence-name');
const spinStatus = document.querySelector('#spin-status');
const sequenceSkip = document.querySelector('#sequence-skip');
const sceneNames = ['Jamestown', 'Wli Falls', 'Cape Coast', 'Made in Accra', 'Larabanga', 'Kakum', 'Accra after rain', 'Independence Arch'];
const spinOrder = [2, 5, 1, 4, 0, 6, 3, 1, 5, 0, 4, 2, 6, 3, 5, 6, 7];
const spinHolds = [72, 58, 50, 48, 50, 54, 60, 68, 78, 92, 112, 140, 180, 230, 300, 390, 520];
let spinStep = 0;
let activeScene = 0;
let sceneTimer;
let sequenceFinished = false;

function showScene(index, duration = 120) {
  if (index === activeScene) return;
  const outgoing = scenes[activeScene];
  const incoming = scenes[index];
  outgoing?.style.setProperty('--slot-duration', `${duration}ms`);
  incoming?.style.setProperty('--slot-duration', `${duration}ms`);
  outgoing?.classList.remove('is-active');
  outgoing?.classList.add('is-leaving');
  incoming?.classList.remove('is-leaving');
  incoming?.classList.add('is-active');
  setTimeout(() => outgoing?.classList.remove('is-leaving'), duration + 40);
  activeScene = index;
  sequenceCount.textContent = `${String(index + 1).padStart(2, '0')} / 08`;
  sequenceName.textContent = sceneNames[index];
}

function finishSequence(skip = false) {
  if (sequenceFinished) return;
  sequenceFinished = true;
  clearTimeout(sceneTimer);
  const settleTime = skip ? 140 : 460;
  showScene(7, settleTime);
  setTimeout(() => {
    heroWindow.classList.remove('is-sequencing');
    heroWindow.classList.add('is-settled');
    spinStatus.classList.add('is-hidden');
    spinStatus.setAttribute('aria-hidden', 'true');
    sequenceSkip.classList.add('is-hidden');
    sequenceSkip.disabled = true;
    heroVideo?.play().catch(() => {});
  }, settleTime);
}

function playSequence() {
  if (spinStep >= spinOrder.length) {
    finishSequence();
    return;
  }
  const hold = spinHolds[spinStep];
  showScene(spinOrder[spinStep], Math.max(48, hold * .78));
  spinStep += 1;
  sceneTimer = setTimeout(playSequence, hold);
}

if (reduced) finishSequence(true);
else {
  heroVideo?.play().catch(() => {});
  sceneTimer = setTimeout(playSequence, 140);
}
sequenceSkip?.addEventListener('click', () => finishSequence(true));

const hero = document.querySelector('.hero');
const heroStage = document.querySelector('.hero-stage');
const siteNav = document.querySelector('.nav');
const darkSections = [...document.querySelectorAll('.regions, .most-visited, footer')];
let frameRequested = false;

function clamp(number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, number));
}

function mix(start, end, progress) {
  return start + (end - start) * progress;
}

function renderHero() {
  let heroUsesLightNav = false;
  if (!reduced && hero && heroStage) {
    const heroRect = hero.getBoundingClientRect();
    const travel = Math.max(1, hero.offsetHeight - innerHeight);
    const progress = clamp(-heroRect.top / travel);
    const eased = 1 - Math.pow(1 - progress, 3);
    const start = innerWidth < 680 ? innerWidth * .58 : Math.min(innerWidth * .29, 430);
    const end = Math.max(innerWidth, innerHeight) * 2.2;
    heroStage.style.setProperty('--mask-size', `${mix(start, end, eased).toFixed(1)}px`);
    const reveal = clamp((progress - .42) / .24);
    heroStage.style.setProperty('--copy-opacity', reveal.toFixed(3));
    heroStage.style.setProperty('--copy-y', `${(1 - reveal) * 34}px`);
    heroUsesLightNav = progress > .13 && heroRect.bottom > 76;
  }
  const darkSectionUnderNav = darkSections.some(section => {
    const rect = section.getBoundingClientRect();
    return rect.top <= 76 && rect.bottom > 20;
  });
  siteNav?.classList.toggle('is-over-image', heroUsesLightNav || darkSectionUnderNav);
  frameRequested = false;
}

addEventListener('scroll', () => {
  if (!frameRequested) {
    requestAnimationFrame(renderHero);
    frameRequested = true;
  }
}, { passive: true });
addEventListener('resize', renderHero);
renderHero();

/* The postcard rail travels, spreads into a field, then stacks vertically on selection. */
const regionSection = document.querySelector('.regions');
const regionSticky = document.querySelector('.regions-sticky');
const regionRail = document.querySelector('#region-rail');
const reader = document.querySelector('#region-reader');
const readerClose = document.querySelector('#reader-close');
const readerLink = document.querySelector('#reader-link');
const regionTones = ['#df4a32', '#f5c842', '#176a4b', '#ad9ae8', '#e58b65', '#e8d1a4', '#df4a32', '#f5c842', '#176a4b', '#ad9ae8', '#df4a32', '#6bb68d', '#e8d1a4', '#f5c842', '#176a4b', '#df4a32'];
let regionCards = [];
let selectedRegion = null;
let lastRegionTrigger = null;

regions.forEach((region, index) => {
  const card = document.createElement('button');
  card.className = 'region-card has-image';
  card.type = 'button';
  card.style.setProperty('--image', `url('${region.image}')`);
  card.style.setProperty('--tone', regionTones[index]);
  card.innerHTML = `<span class="card-no">${String(index + 1).padStart(2, '0')}</span><strong class="card-name">${region.name}</strong><small class="card-note">${region.known}</small><i class="card-arrow">↘</i>`;
  card.setAttribute('aria-label', `Explore ${region.name}`);
  card.addEventListener('click', () => openRegion(index, card));
  regionRail.append(card);
  regionCards.push(card);
});

/* Every dimension is derived from the viewport so the spread deck always fits inside it.
   The previous fixed 139px column gap pushed 8 of 16 cards off a 375px screen. */
function regionMetrics() {
  const mobile = innerWidth < 680;
  const columns = mobile ? 4 : 8;
  const rows = Math.ceil(regions.length / columns);
  const sideMargin = 20; /* absorbs the bounding box the card's rotation adds */
  const cardWidth = mobile
    ? Math.max(66, (innerWidth - sideMargin * 2) / columns - 4)
    : Math.min(164, innerWidth * .105);
  const cardHeight = cardWidth / .71;
  const gapX = mobile ? cardWidth + 4 : Math.min(165, innerWidth * .123);
  /* On phones the title and the scroll hint each need room above and below the field. */
  const band = innerHeight - 300;
  const gapY = mobile
    ? Math.max(84, Math.min(124, (band - cardHeight) / Math.max(1, rows - 1)))
    : Math.min(250, innerHeight * .34);
  return { mobile, columns, rows, cardWidth, cardHeight, gapX, gapY };
}

function layoutRegionCards(progress) {
  const { mobile, columns, rows, cardWidth, gapX, gapY } = regionMetrics();
  const lineGap = cardWidth * 1.08;
  const settle = clamp((progress - .55) / .35);
  const eased = 1 - Math.pow(1 - settle, 3);
  const sweep = mix(innerWidth * .92, -innerWidth * .52, clamp(progress / .55));
  regionRail.style.setProperty('--card-w', `${cardWidth.toFixed(1)}px`);

  regionCards.forEach((card, index) => {
    const lineX = (index - 7.5) * lineGap + sweep;
    const lineY = Math.sin(index * 1.7) * 24;
    const column = index % columns;
    const row = Math.floor(index / columns);
    const gridX = (column - (columns - 1) / 2) * gapX;
    const gridY = (row - (rows - 1) / 2) * gapY + (mobile ? 34 : 70);
    card.style.setProperty('--x', mix(lineX, gridX, eased).toFixed(1));
    card.style.setProperty('--y', mix(lineY, gridY, eased).toFixed(1));
    card.style.setProperty('--r', mix((index % 2 ? 1 : -1) * 6, ((index * 7) % 9) - 4, eased).toFixed(2));
    card.style.zIndex = String(index + 1);
  });
}

function layoutRegionStack(activeIndex) {
  const { mobile, cardWidth } = regionMetrics();
  regionRail.style.setProperty('--card-w', `${cardWidth.toFixed(1)}px`);
  const stackX = mobile ? -innerWidth * .36 : -innerWidth * .39;
  const gap = mobile ? 26 : 29;
  regionCards.forEach((card, index) => {
    const offset = index - activeIndex;
    card.style.setProperty('--stack-x', (stackX + Math.sin(index) * 2).toFixed(1));
    card.style.setProperty('--stack-y', (offset * gap + 34).toFixed(1));
    card.style.setProperty('--stack-r', (offset * .22).toFixed(2));
    card.style.setProperty('--stack-scale', mobile ? '.46' : '.54');
    card.style.zIndex = String(card.classList.contains('is-selected') ? 40 : 18 - Math.abs(offset));
  });
}

/* The reader lives inside the sticky stage, so once the stage unsticks at the end of the
   section it carries the panel — close button and all — off the top of the screen.
   The panel is pinned to the viewport in CSS; here we just park the deck behind it in its
   stuck range on open, and close the reader if the section is scrolled away. */
function stageIsSticky() {
  return !!regionSticky && getComputedStyle(regionSticky).position === 'sticky';
}

function pinRegionStage() {
  if (!regionSection || !stageIsSticky()) return;
  const top = regionSection.offsetTop;
  const max = Math.max(top, top + regionSection.offsetHeight - regionSticky.offsetHeight);
  const target = Math.min(Math.max(scrollY, top), max);
  if (Math.abs(target - scrollY) > 1) scrollTo(0, target);
}

function openRegion(index, trigger) {
  const region = regions[index];
  selectedRegion = index;
  lastRegionTrigger = trigger;
  pinRegionStage();
  regionCards.forEach((card, cardIndex) => card.classList.toggle('is-selected', cardIndex === index));
  regionSection.classList.add('has-selection');
  layoutRegionStack(index);
  document.querySelector('#reader-region').textContent = `${region.name} Region`;
  document.querySelector('#reader-title').textContent = region.name;
  document.querySelector('#reader-intro').textContent = region.intro;
  document.querySelector('#reader-capital').textContent = region.capital;
  document.querySelector('#reader-known').textContent = region.known;
  document.querySelector('#reader-fact').textContent = region.fact;
  const mainImage = document.querySelector('#reader-image-main');
  const sideImage = document.querySelector('#reader-image-side');
  mainImage.src = region.image;
  mainImage.alt = region.shot;
  document.querySelector('#reader-caption').textContent = region.shot;
  /* No second photograph is better than the same photograph twice. */
  const sideFigure = sideImage.closest('figure');
  if (region.side) {
    sideImage.src = region.side;
    sideImage.alt = region.shot2;
    document.querySelector('#reader-caption-side').textContent = region.shot2;
    sideFigure.hidden = false;
  } else {
    sideFigure.hidden = true;
    sideImage.removeAttribute('src');
  }
  sideFigure.parentElement.classList.toggle('is-single', !region.side);
  readerLink.href = `region.html?r=${region.slug}`;
  readerLink.textContent = `Places worth visiting in ${region.name} `;
  readerLink.append(Object.assign(document.createElement('span'), { textContent: '↘' }));
  reader.classList.add('is-open');
  reader.setAttribute('aria-hidden', 'false');
  readerClose.focus({ preventScroll: true });
}

function closeReader(restoreFocus = true) {
  if (!reader.classList.contains('is-open')) return;
  selectedRegion = null;
  reader.classList.remove('is-open');
  reader.setAttribute('aria-hidden', 'true');
  regionSection.classList.remove('has-selection');
  regionCards.forEach(card => card.classList.remove('is-selected'));
  renderRegions();
  if (restoreFocus) lastRegionTrigger?.focus({ preventScroll: true });
}

readerClose?.addEventListener('click', () => closeReader());
readerLink?.addEventListener('click', () => closeReader(false));
addEventListener('keydown', event => {
  if (event.key === 'Escape') closeReader();
});

let regionFrameRequested = false;
function renderRegions() {
  if (!regionSection) return;
  if (selectedRegion !== null) {
    /* A viewport-pinned panel must not be left hovering over a different section. */
    const rect = regionSection.getBoundingClientRect();
    if (rect.bottom < innerHeight * .4 || rect.top > innerHeight * .6) closeReader(false);
    else layoutRegionStack(selectedRegion);
  }
  else {
    const travel = Math.max(1, regionSection.offsetHeight - innerHeight);
    const progress = clamp(-regionSection.getBoundingClientRect().top / travel);
    layoutRegionCards(progress);
  }
  regionFrameRequested = false;
}
addEventListener('scroll', () => {
  if (!regionFrameRequested) {
    requestAnimationFrame(renderRegions);
    regionFrameRequested = true;
  }
}, { passive: true });
addEventListener('resize', renderRegions);
renderRegions();

/* Prototype niceness meter. Votes remain local to this preview. */
function wireNiceButton(button) {
  button.addEventListener('click', () => {
    const pressed = button.getAttribute('aria-pressed') === 'true';
    const baseCount = Number(button.dataset.count || 0);
    button.setAttribute('aria-pressed', String(!pressed));
    button.firstChild.textContent = pressed ? '♡ ' : '♥ ';
    button.querySelector('b').textContent = String(baseCount + (pressed ? 0 : 1));
  });
}
document.querySelectorAll('.nice-button').forEach(wireNiceButton);

const regionSelect = document.querySelector('[name="region"]');
regions.forEach(region => {
  const option = document.createElement('option');
  option.value = region.slug;
  option.textContent = region.name;
  regionSelect?.append(option);
});

const placeForm = document.querySelector('#place-form');
const formStatus = document.querySelector('#form-status');
const communityWall = document.querySelector('.community-wall');
placeForm?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(placeForm);
  const place = String(data.get('place') || '').trim();
  const location = String(data.get('location') || '').trim();
  const note = String(data.get('note') || '').trim();
  const kind = String(data.get('kind') || 'Place');
  const slug = String(data.get('region') || '');
  const matched = regions.find(region => region.slug === slug);
  if (!place) return;

  /* Saved to this browser so it also appears on that region's own page. */
  const saved = tipStore.add({ place, location, note, kind, regionSlug: slug, regionName: matched?.name || '' });

  const tile = document.createElement('article');
  tile.className = 'place-tile';
  const regionLabel = document.createElement('span');
  regionLabel.textContent = matched ? matched.name : (location || 'Region to confirm');
  const chip = document.createElement('i');
  chip.className = kind === 'Local business' ? 'kind is-business' : 'kind';
  chip.textContent = kind;
  regionLabel.append(' ', chip);
  const title = document.createElement('h3');
  title.textContent = place;
  const niceButton = document.createElement('button');
  niceButton.className = 'nice-button';
  niceButton.type = 'button';
  niceButton.dataset.count = '1';
  niceButton.setAttribute('aria-pressed', 'true');
  niceButton.append(document.createTextNode('♥ '), Object.assign(document.createElement('b'), { textContent: '1' }), document.createTextNode(' found it nice'));
  wireNiceButton(niceButton);
  tile.append(regionLabel, title, niceButton);
  communityWall.prepend(tile);

  formStatus.textContent = matched && saved
    ? `Thanks — “${place}” is on the wall, and on the ${matched.name} page.`
    : `Thanks — “${place}” has been added to this preview.`;
  placeForm.reset();
});

document.querySelector('#year').textContent = new Date().getFullYear();
