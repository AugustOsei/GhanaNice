# Ticket card (kept for Experiences)

The ticket-style card was built for the featured events on `/december/` (October 2026) and taken off
that page on 2026-10-24: it felt out of place among the event cards. It is kept here as the starting
point for the planned **Experiences** page, where people book something and a ticket is literal.

What it is: a photo stub on the left (on phones, on top) that flips to the next credited photo, a
dashed perforation with half-circle notches, a route line ("FRI 4 DEC ──── ACCRA"), the name in large
serif, kind and region badges, the venue, a note, the link and a barcode drawn from the item's id.
Tickets slide up and settle at a slight tilt as they come into view.

It used the event data shape in `tools/december/2026.json` (`feature.town`, `feature.note`,
`feature.photos[]` with file, w, h, alt, caption, author, license, source) and the site's tokens.

## Builder code (from tools/build_december.mjs)

```js
const shortDate = (e) => {
  const d = (t) => `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()].slice(0, 3).toUpperCase()}`;
  if (+e.start === +e.end) return `${WEEKDAYS[e.start.getUTCDay()].slice(0, 3).toUpperCase()} ${d(e.start)}`;
  return e.start.getUTCMonth() === e.end.getUTCMonth() ? `${e.start.getUTCDate()}–${d(e.end)}` : `${d(e.start)}–${d(e.end)}`;
};

/* A barcode drawn from the event's id, so each ticket has its own */
function barcode(id) {
  let h = 7, x = 0, bars = '';
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  while (x < 120) { h = (h * 1103515245 + 12345) >>> 0; const w = 1 + (h >>> 16) % 3; bars += `<rect x="${x}" width="${w}" height="30"/>`; x += w + 1 + (h >>> 20) % 3; }
  return `<svg class="barcode" viewBox="0 0 120 30" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
}
/* Featured events are tickets: a photo stub (tap to flip to the next photo, each credited) and the ticket itself */
function ticket(e, kind, cls, link) {
  const f = e.feature, n = f.photos.length;
  const photos = f.photos.map((p, i) => `<figure class="ph${i ? '' : ' is-on'}"><img src="${esc(p.file)}" alt="${esc(p.alt)}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async"><figcaption><span>${esc(p.caption)}</span><small>${esc(p.author)} · <a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.license)}</a></small></figcaption></figure>`).join('');
  return `          <li class="is-featured"><article class="card ticket ${cls}" id="e-${esc(e.id)}" data-to="${esc(e.to)}">
            <div class="stub"><div class="flip">${photos}</div>${n > 1 ? `<button class="stub-next" type="button" aria-label="Next photo of ${esc(e.name)}"><span aria-hidden="true">↻</span> <span class="stub-count">1 / ${n}</span></button>` : ''}</div>
            <div class="tbody">
              <p class="route"><b>${esc(shortDate(e))}</b><i aria-hidden="true"></i><b>${esc(f.town.toUpperCase())}</b></p>
              <h3>${esc(e.name)}</h3><p class="card-sum">${esc(e.sum)}</p>
              <p class="badges"><span class="badge">${kind}</span>${e.region ? `<a class="badge" href="/regions/${regionSlug(e.region)}/">${esc(e.region)}</a>` : ''}</p>
              <ul class="facts"><li><b>Where</b><span>${esc(e.venue)}</span></li></ul>
              <p class="feat-note">${esc(f.note)}${f.more ? ` <a href="${esc(f.more.url)}">${esc(f.more.label)} →</a>` : ''}</p>
              <div class="tfoot"><a class="more" href="${esc(link.url)}" target="_blank" rel="noopener" aria-label="${esc(link.label)}: ${esc(e.name)}">${esc(link.label)} →</a>${barcode(e.id)}</div>
            </div>
          </article></li>`;
}
```

## Styles (from tools/december-template.html)

```css
    /* ---------- Featured events are tickets: a photo stub and the ticket, with a perforation between ---------- */
    .cards > .is-featured { grid-column: span 2; }
    .ticket { --notch: var(--paper); flex-direction: row; border-top: 0; border-radius: 16px; overflow: visible; transform: rotate(var(--tilt, 0deg)); }
    .is-featured:nth-child(odd) .ticket { --tilt: -.6deg; }
    .is-featured:nth-child(even) .ticket { --tilt: .5deg; }
    .stub { position: relative; flex: 0 0 40%; min-height: 300px; border-radius: 16px 0 0 16px; overflow: hidden; background: var(--ink); perspective: 900px; }
    .flip { position: absolute; inset: 0; transform-style: preserve-3d; }
    .ph { position: absolute; inset: 0; margin: 0; display: none; }
    .ph.is-on { display: block; }
    .ph img { width: 100%; height: 100%; object-fit: cover; }
    .ph figcaption { position: absolute; left: 0; right: 0; bottom: 0; padding: 28px 12px 10px; background: linear-gradient(transparent, rgba(17,17,15,.78)); color: var(--paper); font-size: .7rem; line-height: 1.3; }
    .ph figcaption span { display: block; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: .85rem; }
    .ph figcaption small { font-size: .6rem; color: rgba(241,238,229,.75); }
    .ph figcaption a { border-bottom: 1px solid; }
    .stub-next { position: absolute; z-index: 3; top: 10px; left: 10px; border: 0; border-radius: 99px; padding: 7px 11px 6px; background: var(--yellow); color: var(--ink); font: inherit; font-size: .62rem; font-weight: 800; letter-spacing: .08em; cursor: pointer; box-shadow: 0 4px 10px -4px rgba(0,0,0,.4); }
    .stub-next:hover { background: var(--paper); }
    .stub-next span[aria-hidden] { display: inline-block; font-size: .9rem; transition: transform .4s var(--ease); }
    .stub-next:hover span[aria-hidden] { transform: rotate(180deg); }
    .tbody { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 20px 22px 18px 26px; border-left: 2px dashed rgba(17,17,15,.22); border-top: 6px solid var(--kc); border-radius: 0 16px 16px 0; background: #fff; }
    /* The notches where the stub would tear off */
    .tbody::before, .tbody::after { content: ''; position: absolute; left: -12px; width: 22px; height: 22px; border-radius: 50%; background: var(--notch); }
    .tbody::before { top: -14px; }
    .tbody::after { bottom: -11px; }
    .route { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; margin: 0 0 12px; font-size: 1.15rem; font-weight: 900; letter-spacing: -.02em; }
    .route i { height: 2px; background: var(--ink); }
    .ticket h3 { margin: 0 0 8px; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(1.7rem, 2.6vw, 2.4rem); font-weight: 400; line-height: 1; letter-spacing: -.02em; }
    .badges { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 12px; }
    .badge { padding: 6px 10px 5px; border: 1.5px solid var(--kc); background: color-mix(in srgb, var(--kc) 14%, #fff); font-size: .6rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--kt); }
    a.badge:hover { background: var(--kc); color: var(--ink); }
    .feat-note { margin: -4px 0 12px; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: .84rem; line-height: 1.4; color: rgba(17,17,15,.62); }
    .feat-note a { font-style: normal; font-family: Arial, Helvetica, sans-serif; font-size: .72rem; font-weight: 800; border-bottom: 1px solid; }
    .tfoot { margin-top: auto; display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; }
    .tfoot .more { margin: 0; }
    .barcode { flex: 0 0 auto; width: 96px; height: 30px; fill: var(--ink); opacity: .85; }
    /* Tickets slide up and settle as they come into view */
    .js-anim .ticket { opacity: 0; transform: translateY(36px) rotate(calc(var(--tilt, 0deg) * 4)); transition: opacity .6s var(--ease), transform .7s var(--ease), box-shadow .3s; }
    .js-anim .ticket.is-in { opacity: 1; transform: rotate(var(--tilt, 0deg)); }
    .js-anim .ticket.is-in.is-past { opacity: .45; }
    .ticket:hover { box-shadow: 0 1px 0 rgba(0,0,0,.06), 0 26px 40px -24px rgba(0,0,0,.6); }


  @media (max-width: 760px) {
      /* Phone tickets: the photo on top, the perforation across */
      .cards > .is-featured { grid-column: 1 / -1; }
      .ticket { flex-direction: column; margin: 8px 0; }
      .stub { flex: none; min-height: 0; aspect-ratio: 4 / 3; border-radius: 16px 16px 0 0; }
      .tbody { padding: 18px 16px 16px; border-left: 0; border-top: 2px dashed rgba(17,17,15,.22); border-radius: 0 0 16px 16px; box-shadow: inset 0 6px 0 var(--kc); }
      .tbody::before, .tbody::after { top: -12px; bottom: auto; }
      .tbody::before { left: -11px; }
      .tbody::after { left: auto; right: -11px; }
      .route { font-size: 1rem; }
      .ticket h3 { font-size: 1.7rem; }
      .ticket .card-sum { font-size: .9rem; }
      .ticket .facts { font-size: .78rem; }
      .ticket .facts li { grid-template-columns: 56px 1fr; gap: 8px; }
      .ticket .facts b { font-size: .55rem; }
      .ticket .more { font-size: .72rem; }
  }
```

## Script

```js
    /* ---------- Featured tickets: slide in on view; the stub flips to the next photo ---------- */
    const tickets = [...document.querySelectorAll('.ticket')];
    if (!reduce && 'IntersectionObserver' in window) {
      document.querySelector('.cards').classList.add('js-anim');
      const seen = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); seen.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
      tickets.forEach((t) => seen.observe(t));
    }
    tickets.forEach((t) => {
      const flip = t.querySelector('.flip'), photos = [...t.querySelectorAll('.ph')], btn = t.querySelector('.stub-next'), count = t.querySelector('.stub-count');
      if (photos.length < 2) return;
      let i = 0, busy = false;
      const show = () => { photos.forEach((p, k) => p.classList.toggle('is-on', k === i)); count.textContent = `${i + 1} / ${photos.length}`; };
      const next = () => {
        if (busy) return;
        i = (i + 1) % photos.length;
        if (reduce || !flip.animate) return show();
        busy = true;
        flip.animate([{ transform: 'rotateY(0)' }, { transform: 'rotateY(90deg)' }], { duration: 200, easing: 'ease-in' }).onfinish = () => {
          show();
          flip.animate([{ transform: 'rotateY(-90deg)' }, { transform: 'rotateY(0)' }], { duration: 260, easing: 'ease-out' }).onfinish = () => { busy = false; };
        };
      };
      btn.addEventListener('click', next);
      flip.addEventListener('click', (ev) => { if (!ev.target.closest('a')) next(); });
    });

```
