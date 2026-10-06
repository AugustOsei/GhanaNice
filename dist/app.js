/* A browser refresh normally restores the previous scroll offset. On the homepage that
   can restart the image reel after the Ghana silhouette has already expanded full-screen.
   Start true home loads at the top, but preserve deliberate deep links such as #regions. */
const startsAtHome = !location.hash || location.hash === '#home';
if ('scrollRestoration' in history) history.scrollRestoration = startsAtHome ? 'manual' : 'auto';
if (startsAtHome) scrollTo(0, 0);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const regions = window.GHANA_REGIONS;

/* The photos in assets/real/ ship with smaller WebP copies (tools/media/resize_local.py). */
const sized = (src, width) => src.replace(/\.(jpe?g|png)$/, `-${width}.webp`);

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
const sequenceAnnouncement = document.querySelector('#sequence-announcement');
/* The arch appears exactly once, as the final scene. The old reel also carried a storm-lit
   copy of the same photograph, so it looked like the last image landed twice. */
const sceneNames = ['Jamestown', 'Wli Falls', 'Cape Coast', 'Made in Accra', 'Larabanga', 'Kakum', 'Independence Arch'];
const FINAL_SCENE = sceneNames.length - 1;
const spinOrder = [2, 5, 1, 4, 0, 3, 1, 5, 0, 4, 2, 3, 5, 0, 2, 4, FINAL_SCENE];
const spinHolds = [72, 58, 50, 48, 50, 54, 60, 68, 78, 92, 112, 140, 180, 230, 300, 390, 520];
let reelAnimations = [];
let sequenceFinished = false;

function labelScene(index) {
  sequenceCount.textContent = `${String(index + 1).padStart(2, '0')} / ${String(sceneNames.length).padStart(2, '0')}`;
  sequenceName.textContent = sceneNames[index];
}

function landOnFinalScene() {
  scenes.forEach((scene, index) => scene.classList.toggle('is-active', index === FINAL_SCENE));
  reelAnimations.forEach(animation => animation.cancel());
  reelAnimations = [];
  labelScene(FINAL_SCENE);
}

/* The video's first frame is the final still, so it is started from frame 0 and only
   revealed once it is actually playing: the hand-off is invisible instead of a jump cut. */
function revealVideo() {
  if (heroWindow.classList.contains('is-settled')) return;
  heroWindow.classList.remove('is-sequencing');
  heroWindow.classList.add('is-settled');
}

function finishSequence(skip = false) {
  if (sequenceFinished) return;
  sequenceFinished = true;
  landOnFinalScene();
  const settleTime = skip ? 140 : 460;
  setTimeout(() => {
    spinStatus.classList.add('is-hidden');
    spinStatus.setAttribute('aria-hidden', 'true');
    sequenceSkip.classList.add('is-hidden');
    sequenceSkip.disabled = true;
    sequenceAnnouncement.textContent = 'Showing Independence Arch in Accra.';
    /* Reduced motion keeps the still arch (the poster) instead of a looping video. */
    if (!heroVideo || reduced) return revealVideo();
    try { heroVideo.currentTime = 0; } catch {}
    /* play() can remain pending while a browser waits for media data. Never let that keep
       the reel stuck: the poster and window background are the same final frame. */
    const fallback = setTimeout(revealVideo, 900);
    try {
      const playback = heroVideo.play();
      if (playback?.then) playback.then(() => {
        clearTimeout(fallback);
        revealVideo();
      }, () => {
        clearTimeout(fallback);
        revealVideo();
      });
      else revealVideo();
    } catch {
      clearTimeout(fallback);
      revealVideo();
    }
  }, settleTime);
}

/* Pause the loop offscreen instead of relying on each browser's battery-saving policy. */
let heroVisible = true;
if (heroVideo && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting;
    if (!heroVisible) {
      heroVideo.pause();
      return;
    }
    if (reduced || !sequenceFinished) return;
    if (heroVideo.paused) heroVideo.play().catch(() => {});
  }).observe(heroWindow);
}
heroVideo?.addEventListener('canplay', () => {
  if (!reduced && sequenceFinished && heroVisible && heroVideo.paused) heroVideo.play().catch(() => {});
});

/* The whole reel is one keyframe timeline per photo, all started together. Every step slides
   the incoming photo down from above while the outgoing one leaves below in lockstep, so
   the two always meet edge to edge. Photos return to the top while they are out of view. */
const SLOT_EASE = 'cubic-bezier(.18,.72,.24,1)';
const spinStarts = spinHolds.map((hold, step) => spinHolds.slice(0, step).reduce((sum, value) => sum + value, 0));
const spinTotal = spinStarts[spinStarts.length - 1] + spinHolds[spinHolds.length - 1];

function sceneKeyframes(scene) {
  const at = (time, y, easing = 'linear') => ({ offset: Math.min(1, time / spinTotal), transform: `translateY(${y}%)`, easing });
  let y = scene === 0 ? 0 : -100;
  const frames = [at(0, y)];
  spinOrder.forEach((incoming, step) => {
    const outgoing = step ? spinOrder[step - 1] : 0;
    const start = spinStarts[step];
    const end = start + Math.min(spinHolds[step], Math.max(48, spinHolds[step] * .78));
    if (incoming === scene) {
      frames.push(at(start, -100, SLOT_EASE), at(end, 0));
      y = 0;
    } else if (outgoing === scene) {
      frames.push(at(start, 0, SLOT_EASE), at(end, 100), at(end, -100));
      y = -100;
    }
  });
  frames.push(at(spinTotal, y));
  return frames;
}

function playSequence() {
  if (sequenceFinished) return;
  reelAnimations = scenes.map((scene, index) => scene.animate(sceneKeyframes(index), { duration: spinTotal, fill: 'forwards' }));
  const clock = reelAnimations[0];
  clock.finished.then(() => finishSequence(), () => {});
  let shownStep = -1;
  (function followReel() {
    if (sequenceFinished) return;
    const step = spinStarts.findLastIndex(start => start <= (clock.currentTime || 0));
    if (step !== shownStep) {
      shownStep = step;
      labelScene(spinOrder[step]);
    }
    requestAnimationFrame(followReel);
  })();
}

/* Start only once every photo is downloaded and decoded, so no step lands on an empty or
   half-decoded frame. A visitor on a very slow connection goes straight to the arch. */
if (reduced || !scenes[0]?.animate) finishSequence(true);
else {
  const decoded = Promise.all(scenes.map(scene => scene.decode().catch(() => {})));
  const tooSlow = new Promise(resolve => setTimeout(resolve, 3000, 'slow'));
  Promise.race([decoded, tooSlow]).then(result => {
    if (result === 'slow') finishSequence(true);
    else requestAnimationFrame(() => requestAnimationFrame(playSequence));
  });
}
sequenceSkip?.addEventListener('click', () => finishSequence(true));

const hero = document.querySelector('.hero');
const heroStage = document.querySelector('.hero-stage');
const siteNav = document.querySelector('.nav');
const darkSections = [...document.querySelectorAll('.regions, .most-visited')];
let frameRequested = false;

function clamp(number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, number));
}

function mix(start, end, progress) {
  return start + (end - start) * progress;
}

/* How wide the Ghana silhouette must be before it covers the whole viewport, as a multiple
   of viewport height, by aspect ratio. Measured from the outline in ghana-mask.svg. */
const MASK_COVER = [[.46, .96], [.6, 1.06], [.8, 1.41], [1, 1.59], [1.33, 2.11], [1.6, 2.54], [1.78, 2.79], [2, 3.07], [2.4, 3.64]];
function maskCoverSize() {
  const aspect = innerWidth / innerHeight;
  let factor = MASK_COVER[MASK_COVER.length - 1][1] * aspect / MASK_COVER[MASK_COVER.length - 1][0];
  for (let i = 0; i < MASK_COVER.length; i++) {
    const [a, f] = MASK_COVER[i];
    if (aspect <= a) {
      const [pa, pf] = MASK_COVER[i - 1] || [0, f];
      factor = i ? mix(pf, f, (aspect - pa) / (a - pa)) : f;
      break;
    }
  }
  return innerHeight * factor * 1.04;
}

let lastHeroKey = '';
function renderHero() {
  let heroUsesLightNav = false;
  if (!reduced && hero && heroStage) {
    const heroRect = hero.getBoundingClientRect();
    const travel = Math.max(1, hero.offsetHeight - innerHeight);
    const progress = clamp(-heroRect.top / travel);
    heroUsesLightNav = progress > .13 && heroRect.bottom > 76;
    /* Past the hero the values stop changing, so skip restyling the masked stage on every
       scroll frame further down the page. */
    const key = `${progress.toFixed(4)}|${innerWidth}x${innerHeight}`;
    if (key !== lastHeroKey) {
      lastHeroKey = key;
      paintHero(progress);
    }
  }
  const darkSectionUnderNav = darkSections.some(section => {
    const rect = section.getBoundingClientRect();
    return rect.top <= 76 && rect.bottom > 20;
  });
  siteNav?.classList.toggle('is-over-image', heroUsesLightNav || darkSectionUnderNav);
  frameRequested = false;
}

function paintHero(progress) {
  const eased = 1 - Math.pow(1 - progress, 3);
  /* Keep the opening silhouette compact and jewel-like; it still expands to the same
     full-screen endpoint as the visitor scrolls. */
  const start = innerWidth < 680 ? innerWidth * .406 : Math.min(innerWidth * .203, 301);
  const cover = maskCoverSize();
  /* Same pacing as before (full cover about three-quarters of the way in), but once the
     outline covers the screen the mask is removed rather than grown to 4–6000px. A mask
     that large exceeds the GPU texture limit on big retina displays, and Chrome then
     drops the video layer and paints the window's navy background in its place. */
  const size = mix(start, cover / .73, eased);
  const covered = size >= cover;
  heroWindow.classList.toggle('is-unmasked', covered);
  heroStage.style.setProperty('--mask-size', `${Math.min(size, cover).toFixed(1)}px`);
  const reveal = clamp((progress - .42) / .24);
  heroStage.style.setProperty('--copy-opacity', reveal.toFixed(3));
  heroStage.style.setProperty('--copy-y', `${(1 - reveal) * 34}px`);
}

addEventListener('scroll', () => {
  if (!frameRequested) {
    requestAnimationFrame(renderHero);
    frameRequested = true;
  }
}, { passive: true });
addEventListener('resize', renderHero);
renderHero();

/* Chrome and mobile Safari can discard composited mask layers while a tab is suspended.
   The cached hero key then prevents the same scroll position from being painted again on
   return. Reapply the current state on tab restore/wake, and finish a reel whose timers
   were frozen in the background. The .1px mask-size nudge is visually imperceptible but
   makes the browser rebuild the mask layer instead of reusing a discarded texture. */
let heroRefreshFrame = 0;
function restoreHeroAfterPause() {
  if (document.hidden) {
    heroVideo?.pause();
    return;
  }
  if (!reduced && !sequenceFinished) finishSequence(true);
  lastHeroKey = '';
  renderHero();
  if (!reduced && !heroWindow.classList.contains('is-unmasked')) {
    heroWindow.classList.remove('is-mask-refreshing');
    void heroWindow.offsetWidth;
    heroWindow.classList.add('is-mask-refreshing');
    cancelAnimationFrame(heroRefreshFrame);
    heroRefreshFrame = requestAnimationFrame(() => heroWindow.classList.remove('is-mask-refreshing'));
  }
  if (!reduced && sequenceFinished && heroVisible && heroVideo?.paused) heroVideo.play().catch(() => {});
}

document.addEventListener('visibilitychange', restoreHeroAfterPause);
addEventListener('pageshow', event => {
  if (event.persisted) {
    restoreHeroAfterPause();
  } else if (startsAtHome) {
    /* Scroll restoration is applied late by some browsers, so enforce the home position
       once more after the page is shown and repaint the mask from that position. */
    requestAnimationFrame(() => {
      scrollTo(0, 0);
      lastHeroKey = '';
      renderHero();
    });
  }
});
const heroOpenedAt = Date.now();
addEventListener('focus', () => {
  /* Ignore the window's initial focus event; later focus events cover laptop wake and
     browser restores that do not emit a visibility change. */
  if (Date.now() - heroOpenedAt > 4000) restoreHeroAfterPause();
});
document.addEventListener('resume', restoreHeroAfterPause);

/* The postcard rail travels, spreads into a field, then stacks vertically on selection. */
const regionSection = document.querySelector('.regions');
const regionSticky = document.querySelector('.regions-sticky');
const regionRail = document.querySelector('#region-rail');
const reader = document.querySelector('#region-reader');
const readerClose = document.querySelector('#reader-close');
const readerLink = document.querySelector('#reader-link');
const readerPhotoLinks = [...document.querySelectorAll('.reader-photo-link')];
const readerBackground = [
  hero,
  ...document.querySelectorAll('main > :not(#regions)'),
  document.querySelector('.site-footer'),
  ...[...regionSticky.children].filter(child => child !== reader)
].filter(Boolean);
const regionTones = ['#df4a32', '#f5c842', '#176a4b', '#ad9ae8', '#e58b65', '#e8d1a4', '#df4a32', '#f5c842', '#176a4b', '#ad9ae8', '#df4a32', '#6bb68d', '#e8d1a4', '#f5c842', '#176a4b', '#df4a32'];
let regionCards = [];
let selectedRegion = null;
let lastRegionTrigger = null;

regions.forEach((region, index) => {
  const card = document.createElement('button');
  card.className = 'region-card has-image';
  card.type = 'button';
  card.style.setProperty('--image', `url('${sized(region.image, 400)}')`);
  card.style.setProperty('--tone', regionTones[index]);
  card.innerHTML = `<span class="card-no">${String(index + 1).padStart(2, '0')}</span><strong class="card-name">${region.name}</strong><small class="card-note">${region.known}</small><i class="card-arrow">↘</i>`;
  card.setAttribute('aria-label', `Explore ${region.name} Region`);
  card.addEventListener('pointerdown', event => { lastPointerType = event.pointerType; });
  card.addEventListener('click', event => {
    /* On touch the cards overlap and there is no hover, so the first tap lifts a card out of
       the deck to show its name and the second opens it. Mouse and keyboard open at once. */
    const touch = lastPointerType === 'touch' || lastPointerType === 'pen';
    lastPointerType = '';
    if (touch && event.detail !== 0 && liftedCard !== card && selectedRegion === null) {
      liftCard(card);
      return;
    }
    openRegion(index, card);
  });
  card.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') liftCard(card); });
  card.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse' && liftedCard === card) liftCard(null); });
  card.addEventListener('focus', () => { if (card.matches(':focus-visible')) liftCard(card); });
  card.addEventListener('blur', () => { if (liftedCard === card) liftCard(null); });
  regionRail.append(card);
  regionCards.push(card);
});

/* Lifting a card brings it to the front and nudges the cards around it aside, like pulling
   one postcard out of a fanned deck. Positions come from the layout's own --x/--y values. */
let liftedCard = null;
let lastPointerType = '';
/* Cards follow the scroll directly. The long transform glide is only switched on for a
   moment when a card is lifted, opened or put back; left on, every scroll frame restarted
   it and the deck trailed behind the finger on phones. */
let glideTimer;
function glide() {
  regionRail.classList.add('is-gliding');
  clearTimeout(glideTimer);
  glideTimer = setTimeout(() => regionRail.classList.remove('is-gliding'), 900);
}
function liftCard(target, animate = true) {
  if (animate && target !== liftedCard) glide();
  if (selectedRegion !== null) target = null;
  liftedCard = target;
  regionRail.classList.toggle('has-lift', !!target);
  const { cardHeight } = regionMetrics();
  const reach = cardHeight * 1.35;
  const tx = target ? Number(target.style.getPropertyValue('--x')) : 0;
  const ty = target ? Number(target.style.getPropertyValue('--y')) : 0;
  regionCards.forEach(card => {
    card.classList.toggle('is-lifted', card === target);
    let px = 0, py = 0;
    if (target && card !== target) {
      const dx = Number(card.style.getPropertyValue('--x')) - tx;
      const dy = Number(card.style.getPropertyValue('--y')) - ty;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < reach) {
        const push = (1 - distance / reach) * cardHeight * .32;
        px = dx / distance * push;
        py = dy / distance * push;
      }
    }
    card.style.setProperty('--push-x', `${px.toFixed(1)}px`);
    card.style.setProperty('--push-y', `${py.toFixed(1)}px`);
  });
}
/* A tap anywhere outside the deck puts a lifted card back. */
document.addEventListener('pointerdown', event => {
  if (liftedCard && !event.target.closest?.('.region-card')) liftCard(null);
});
if (matchMedia('(hover: none)').matches) {
  document.querySelector('#rail-hint').textContent = 'Tap to lift a region · tap again to open';
}

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
  if (liftedCard) liftCard(liftedCard, false);
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

function setReaderModal(open) {
  document.body.classList.toggle('has-reader', open);
  readerBackground.forEach(node => { node.inert = open; });
}

function openRegion(index, trigger) {
  const region = regions[index];
  selectedRegion = index;
  lastRegionTrigger = trigger;
  glide();
  liftCard(null);
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
  mainImage.src = sized(region.image, 1200);
  mainImage.alt = region.shot;
  document.querySelector('#reader-caption').textContent = region.shot;
  /* No second photograph is better than the same photograph twice. */
  const sideFigure = sideImage.closest('figure');
  if (region.side) {
    sideImage.src = sized(region.side, 800);
    sideImage.alt = region.shot2;
    document.querySelector('#reader-caption-side').textContent = region.shot2;
    sideFigure.hidden = false;
  } else {
    sideFigure.hidden = true;
    sideImage.removeAttribute('src');
  }
  sideFigure.parentElement.classList.toggle('is-single', !region.side);
  readerLink.href = `region.html?r=${region.slug}`;
  readerPhotoLinks.forEach(link => { link.href = readerLink.href; });
  document.querySelector('#reader-link-label').textContent = `Explore ${region.name}`;
  const places = region.visit?.length || 0;
  document.querySelector('#reader-more').textContent = places ? `${places} places to visit, plus more photos` : 'More photos on the full page';
  reader.classList.add('is-open');
  reader.setAttribute('aria-hidden', 'false');
  setReaderModal(true);
  readerClose.focus({ preventScroll: true });
}

function closeReader(restoreFocus = true) {
  if (!reader.classList.contains('is-open')) return;
  selectedRegion = null;
  lastRegionKey = ''; /* the stack rewrote every card's z-index: lay the deck out again */
  glide();
  reader.classList.remove('is-open');
  reader.setAttribute('aria-hidden', 'true');
  regionSection.classList.remove('has-selection');
  regionCards.forEach(card => card.classList.remove('is-selected'));
  setReaderModal(false);
  renderRegions();
  if (restoreFocus) lastRegionTrigger?.focus({ preventScroll: true });
}

readerClose?.addEventListener('click', () => closeReader());
readerLink?.addEventListener('click', () => closeReader(false));
readerPhotoLinks.forEach(link => link.addEventListener('click', () => closeReader(false)));
addEventListener('keydown', event => {
  if (event.key === 'Tab' && reader.classList.contains('is-open')) {
    const stops = [...reader.querySelectorAll('a[href]:not([tabindex="-1"]), button:not([disabled])')];
    const first = stops[0], last = stops[stops.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    else if (!reader.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
  }
  if (event.key === 'Escape') closeReader();
});

let regionFrameRequested = false;
let lastRegionKey = '';
function renderRegions() {
  if (!regionSection) return;
  regionFrameRequested = false;
  if (selectedRegion !== null) {
    /* A viewport-pinned panel must not be left hovering over a different section. */
    const rect = regionSection.getBoundingClientRect();
    if (rect.bottom < innerHeight * .4 || rect.top > innerHeight * .6) closeReader(false);
    else layoutRegionStack(selectedRegion);
  }
  else {
    const travel = Math.max(1, regionSection.offsetHeight - innerHeight);
    const progress = clamp(-regionSection.getBoundingClientRect().top / travel);
    /* Before and after the section the deck is parked: skip rewriting 16 cards per frame. */
    const key = `${progress.toFixed(4)}|${innerWidth}x${innerHeight}`;
    if (key === lastRegionKey) return;
    lastRegionKey = key;
    layoutRegionCards(progress);
  }
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

/* A tip sent from the form (tip-form.js) goes straight onto the wall, marked as waiting. */
const communityWall = document.querySelector('.community-wall');
document.addEventListener('ghananice:tip', event => {
  const tile = window.GhanaTipTile(event.detail.tip);
  const niceButton = document.createElement('button');
  niceButton.className = 'nice-button';
  niceButton.type = 'button';
  niceButton.dataset.count = '1';
  niceButton.setAttribute('aria-pressed', 'true');
  niceButton.append(document.createTextNode('♥ '), Object.assign(document.createElement('b'), { textContent: '1' }), document.createTextNode(' found it nice'));
  wireNiceButton(niceButton);
  tile.append(niceButton);
  communityWall.prepend(tile);
});

document.querySelector('#year').textContent = new Date().getFullYear();

/* Most-visited flip cards: tap the card (or its ↻ button) to turn it over. Links on the back
   still work, and the button keeps it keyboard- and screen-reader-operable. */
document.querySelectorAll('.flip-card').forEach(card => {
  const toggle = card.querySelector('.flip-toggle');
  const name = card.querySelector('h3')?.textContent || 'this place';
  const flip = () => {
    const flipped = card.classList.toggle('is-flipped');
    toggle.setAttribute('aria-pressed', String(flipped));
    toggle.setAttribute('aria-label', flipped ? `Show visitor numbers for ${name}` : `Show a photo of ${name}`);
    const back = card.querySelector('.flip-back');
    back.setAttribute('aria-hidden', String(!flipped));
    back.inert = !flipped;
  };
  toggle.addEventListener('click', event => { event.stopPropagation(); flip(); });
  card.addEventListener('click', event => { if (!event.target.closest('a')) flip(); });
});
