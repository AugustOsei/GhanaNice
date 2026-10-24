/* Writes the December in Ghana page, dist/december/index.html, from tools/december/<year>.json
   (the latest year) and tools/december-template.html.

   The data is the season's events as the December in GH listing gives them (names, dates, venues),
   with our own kind, region and one-line summary for each. The hero (in the template) is a generated
   fabric collage with a sun rising over it and cut-out figures dancing along the bottom. Featured
   events (those with a "feature" in the data) are wide cards with a photo panel. Everything is in the
   HTML; the page's script raises the sun, moves the dancers on scroll, changes the featured photos and
   dims what is past.

   It also writes the December section of the home page (dist/index.html, between its december:home
   markers). tools/build_regions.mjs puts the page in the sitemap and tools/smoke.mjs runs this with --check.
   Re-run after editing the data or the template:  node tools/build_december.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.ghananice.com';
const BASE = '/december/';
const file = path.join(root, 'dist', BASE, 'index.html');
const checkOnly = process.argv.includes('--check');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const KIND = {
  trad: ['Traditional festival', 'k-trad'], music: ['Music & nights out', 'k-music'], fest: ['Festival', 'k-fest'],
  food: ['Food & markets', 'k-food'], arts: ['Stage, art & talks', 'k-arts'], sport: ['Sport & fitness', 'k-sport'], other: ['Event', 'k-other'],
};
/* An event running this many days or more is a season-long one: it leads the list. */
const LONG = 10;

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const regionSlug = (r) => r.toLowerCase().replace(/ /g, '-');
const parse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const DAY = 86400000;
const longDate = (iso) => { const t = parse(iso); return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`; };
const fill = (tpl, values) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => { if (!(k in values)) throw new Error(`Template token {{${k}}} has no value`); return values[k]; });
const json = (v) => JSON.stringify(v).replace(/<\//g, '<\\/');

const year = Math.max(...fs.readdirSync(path.join(root, 'tools/december')).filter((f) => /^\d{4}\.json$/.test(f)).map((f) => +f.slice(0, 4)));
const season = JSON.parse(fs.readFileSync(path.join(root, 'tools/december', `${year}.json`), 'utf8'));
const events = season.events.map((e) => {
  const from = parse(e.from), to = parse(e.to);
  if (!KIND[e.kind]) throw new Error(`${e.id}: unknown kind ${e.kind}`);
  if (to < from) throw new Error(`${e.id}: ends before it starts`);
  return { ...e, start: from, end: to, long: (to - from) / DAY + 1 >= LONG };
}).sort((a, b) => (b.long - a.long) || (a.start - b.start) || (a.end - b.end) || a.name.localeCompare(b.name));
const ids = new Set();
events.forEach((e) => { if (ids.has(e.id)) throw new Error(`Duplicate event id ${e.id}`); ids.add(e.id); });
const lastDay = events.reduce((m, e) => (e.end > m ? e.end : m), events[0].end);
const endLabel = `${lastDay.getUTCDate()} ${MONTHS[lastDay.getUTCMonth()]}`;

/* How many events are on each day of December (for the "events on today" line in December) */
const days = Array.from({ length: 31 }, (_, i) => {
  const date = new Date(Date.UTC(year, 11, i + 1));
  return events.filter((e) => !e.long && e.start <= date && date <= e.end).length;
});
const regionCount = new Set(events.map((e) => e.region).filter(Boolean)).size;

/* ---------- The cards ---------- */
/* The date as one line of plain text, read the way people say it: "Fri 4 Dec", "Fri 4 – Sat 5 Dec",
   "Tue 15 Dec – Sun 3 Jan". All one size, so nothing has to be pieced together. */
const day = (t) => `${WEEKDAYS[t.getUTCDay()].slice(0, 3)} ${t.getUTCDate()}`;
const mon = (t) => MONTHS[t.getUTCMonth()].slice(0, 3);
function stamp(e) {
  const s = e.start, t = e.end;
  const text = +s === +t ? `${day(s)} ${mon(s)}` : s.getUTCMonth() === t.getUTCMonth() ? `${day(s)} – ${day(t)} ${mon(t)}` : `${day(s)} ${mon(s)} – ${day(t)} ${mon(t)}`;
  return `<p class="when"><time datetime="${e.from}">${text}</time></p>`;
}
/* The card: date, kind and region, name, what to expect (in our words), then where, and the time
   and entry where the listing states them. Cards don't link out: the listing is credited once,
   under the list. */
function body(e, kind) {
  const facts = [['Where', e.venue], e.time ? ['Time', e.time] : null, e.entry ? ['Entry', e.entry] : null].filter(Boolean);
  const note = e.feature ? `<p class="feat-note">${esc(e.feature.note)}${e.feature.more ? ` <a href="${esc(e.feature.more.url)}">${esc(e.feature.more.label)} →</a>` : ''}</p>` : '';
  return `<div class="card-body">
              <button class="save" type="button" aria-pressed="false" aria-label="Save ${esc(e.name)} to my plan"><span aria-hidden="true">☆</span></button>
              ${stamp(e)}
              <p class="eyebrow"><b>${kind}</b>${e.region ? ` · <a href="/regions/${regionSlug(e.region)}/">${esc(e.region)}</a>` : ''}</p>
              <h3>${esc(e.name)}</h3><p class="card-sum">${esc(e.more)}</p>
              <ul class="facts">${facts.map(([k, v]) => `<li><b>${k}</b><span>${esc(v)}</span></li>`).join('')}</ul>${note}
            </div>`;
}
/* Featured events: the same card, two columns wide, with a photo panel. The photos cross-fade;
   dots and arrows (and a tap or swipe on the photo) move between them. Each photo carries its credit. */
function photoPanel(e) {
  const f = e.feature, n = f.photos.length;
  const photos = f.photos.map((p, i) => `<figure class="ph${i ? '' : ' is-on'}"><img src="${esc(p.file)}" alt="${esc(p.alt)}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async"><figcaption><span>${esc(p.caption)}</span> <small>${esc(p.author)} · <a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.license)}</a></small></figcaption></figure>`).join('');
  const nav = n > 1 ? `<div class="ph-nav"><button class="ph-prev" type="button" aria-label="Previous photo of ${esc(e.name)}">‹</button><span class="ph-dots" aria-hidden="true">${f.photos.map((_, i) => `<i${i ? '' : ' class="is-on"'}></i>`).join('')}</span><button class="ph-next" type="button" aria-label="Next photo of ${esc(e.name)}">›</button></div>` : '';
  return `<div class="feat-photos">${photos}${nav}</div>`;
}
const cards = events.map((e) => {
  const [kind, cls] = KIND[e.kind];
  const data = `data-id="${esc(e.id)}" data-from="${esc(e.from)}" data-to="${esc(e.to)}" data-kind="${esc(e.kind)}" data-region="${e.region ? regionSlug(e.region) : ''}"${/^free$/i.test(e.entry || '') ? ' data-free="1"' : ''}`;
  return `          <li${e.feature ? ' class="is-featured"' : ''}><article class="card ${cls}${e.feature ? ' feat' : ''}" id="e-${esc(e.id)}" ${data}>
            ${e.feature ? photoPanel(e) : ''}${body(e, kind)}
          </article></li>`;
}).join('\n');
const photoCredits = events.filter((e) => e.feature).flatMap((e) => e.feature.photos)
  .map((p) => `${esc(p.caption)} by <a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.author)}</a> (${esc(p.license)})`);

/* The guide: a short sourced intro and "good to know" above the list, questions below it. [[1,2]] in
   the copy becomes linked source numbers, as on the festival pages. */
const guide = season.guide || { intro: [], know: [], faq: [], sources: [] };
const cite = (text) => esc(text).replace(/\[\[([\d,\s]+)\]\]/g, (_, n) => `<sup>${n.split(',').map((x) => `<a href="#s${x.trim()}">${x.trim()}</a>`).join(', ')}</sup>`);
const plain = (text) => String(text).replace(/\[\[[\d,\s]+\]\]/g, '');
const guideHtml = `    <section class="guide" id="about" aria-labelledby="guide-title">
      <div class="guide-in">
        <div class="guide-text">
          <h2 id="guide-title">December in Ghana</h2>
${guide.intro.map((t) => `          <p>${cite(t)}</p>`).join('\n')}
        </div>
        <aside class="know" aria-labelledby="know-title">
          <h3 id="know-title">Good to know</h3>
          <dl>
${guide.know.map(([k, v]) => `            <div><dt>${esc(k)}</dt><dd>${cite(v)}</dd></div>`).join('\n')}
          </dl>
        </aside>
      </div>
    </section>`;
const faqHtml = guide.faq.length ? `        <section class="faq" id="faq" aria-labelledby="faq-title">
          <h2 id="faq-title">Questions people ask</h2>
${guide.faq.map((q) => `          <h3>${esc(q.q)}</h3>\n          <p>${cite(q.a)}</p>`).join('\n')}
        </section>` : '';
const sourcesHtml = guide.sources.length ? `        <section class="sources" aria-labelledby="sources-title">
          <h2 id="sources-title">Sources</h2>
          <ol>
${guide.sources.map((x, i) => `            <li id="s${i + 1}">${esc(x.cite)}, <a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.site)}</a>${x.date ? `, ${esc(x.date)}` : ''}.</li>`).join('\n')}
          </ol>
        </section>` : '';

/* Filters over the list, folded behind one "Filter events" button: where (region), when (a stretch of
   the season), what (kind), free only and saved only. The page's script does the filtering; without
   it the controls stay hidden. */
const count = (f) => events.filter(f).length;
const regionNames = [...new Set(events.map((e) => e.region).filter(Boolean))].sort((a, b) => count((e) => e.region === b) - count((e) => e.region === a));
const WINDOWS = [['early', '1–13 Dec', `${year}-12-01`, `${year}-12-13`], ['mid', '14–23 Dec', `${year}-12-14`, `${year}-12-23`],
  ['xmas', 'Christmas to New Year’s Eve', `${year}-12-24`, `${year}-12-31`], ['ny', 'New Year (1–5 Jan)', `${year + 1}-01-01`, `${year + 1}-01-05`]];
const kindsUsed = Object.keys(KIND).filter((k) => count((e) => e.kind === k));
const filtersHtml = `        <div class="filters" id="filters" hidden>
          <div class="f-head">
            <button type="button" class="f-toggle" id="f-toggle" aria-expanded="false" aria-controls="f-panel">Filter events<span class="f-on" id="f-on"></span> <span class="f-caret" aria-hidden="true">▾</span></button>
            <p class="f-count" id="f-count" aria-live="polite"></p>
            <button type="button" class="f-clear" id="f-clear" hidden>Clear filters</button>
          </div>
          <div class="f-panel" id="f-panel" role="group" aria-label="Filter the events" hidden>
            <label class="f-field">Where <select id="f-where"><option value="">Anywhere</option>${regionNames.map((r) => `<option value="${regionSlug(r)}">${esc(r)} (${count((e) => e.region === r)})</option>`).join('')}</select></label>
            <label class="f-field">When <select id="f-when"><option value="">All season</option>${WINDOWS.map(([v, label, a, b]) => `<option value="${v}" data-from="${a}" data-to="${b}">${esc(label)}</option>`).join('')}</select></label>
            <div class="f-kinds" role="group" aria-label="Type of event">${kindsUsed.map((k) => `<button type="button" class="f-kind k-${k}" data-kind="${k}" aria-pressed="false">${esc(KIND[k][0])}</button>`).join('')}</div>
            <label class="f-check"><input type="checkbox" id="f-free"> Free only</label>
            <label class="f-check"><input type="checkbox" id="f-saved"> ★ Saved only</label>
          </div>
        </div>`;

/* The traditional festivals on /festivals/ that fall in December */
const festivals = fs.readdirSync(path.join(root, 'tools/festivals')).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(root, 'tools/festivals', f), 'utf8')))
  .filter((f) => f.month === 11 && f.sections?.length).sort((a, b) => a.name.localeCompare(b.name));
const festivalsHtml = festivals.length ? `        <p class="also"><b>Also in December</b>${festivals.map((f) => `<span><a href="/festivals/${f.slug}/">${esc(f.name)}</a> · ${esc(f.card.place)}${f.region ? `, ${esc(f.region)}` : ''}</span>`).join('')}<span><a href="/festivals/#m-11">More on the festivals page</a></span></p>` : '';

/* ---------- Head, structured data and the page ---------- */
const url = `${SITE}${BASE}`;
const description = `What’s on in Ghana for December in GH ${year} (Detty December): ${events.length} concerts, carnivals, festivals, plays and markets, day by day from 1 December to ${endLabel}, with public holidays and harmattan weather.`;
const ld = { '@context': 'https://schema.org', '@graph': [
  { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'GhanaNice', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name: `December in Ghana ${year}`, item: url },
  ] },
  { '@type': 'CollectionPage', name: `December in Ghana ${year}: what’s on`, description, url, dateModified: season.checked,
    mainEntity: { '@type': 'ItemList', itemListElement: events.map((e, i) => ({ '@type': 'ListItem', position: i + 1, item: {
      '@type': 'Event', name: e.name, description: e.more, startDate: e.from, endDate: e.to, url: `${url}#e-${e.id}`,
      eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: e.venue, address: { '@type': 'PostalAddress', ...(e.region ? { addressRegion: e.region } : {}), addressCountry: 'GH' } },
    } })) } },
  ...(guide.faq.length ? [{ '@type': 'FAQPage', mainEntity: guide.faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: plain(q.a) } })) }] : []),
] };
const pageTemplate = fs.readFileSync(path.join(root, 'tools/page-template.html'), 'utf8');
const footer = pageTemplate.slice(pageTemplate.indexOf('  <footer class="site-footer">'), pageTemplate.indexOf('</footer>') + 9);
const html = fill(fs.readFileSync(path.join(root, 'tools/december-template.html'), 'utf8'), {
  metaTitle: esc(`December in Ghana ${year}: events and what’s on (Detty December) · GhanaNice`),
  guide: guideHtml, faq: faqHtml, sources: sourcesHtml, filters: filtersHtml,
  ogTitle: esc(`December in Ghana ${year}: what’s on`), description: esc(description), url,
  jsonld: JSON.stringify(ld, null, 2).replace(/^/gm, '  ').replace(/<\//g, '<\\/'),
  count: events.length, festivals: festivalsHtml, list: cards, footer,
  lede: esc(`${events.length} events across ${regionCount} regions, from 1 December to ${endLabel}. Last checked ${longDate(season.checked).replace(/ \d{4}$/, '')}.`),
  source: `<b>Source</b> Every event here comes from the <a href="${esc(season.source.url)}" target="_blank" rel="noopener">${esc(season.source.name)} listing</a>, which has tickets, contacts and the latest details. We read it on ${longDate(season.checked)}: names, dates and venues are theirs, the words on the cards are ours. Plans change, so check before you travel.`,
  credits: `${photoCredits.length ? `Photos from Wikimedia Commons and Unsplash: ${photoCredits.join(', ')}. Full credits on the <a href="/credits.html">photo credits</a> page.` : ''}`,
  data: json({ year, count: events.length, end: endLabel, days }),
});

/* ---------- The home page section ----------
   dist/index.html is written by hand; this fills in only the block between its december:home markers:
   the hero's fabric collage, sun and three of its dancers, with the count and a way in. Images are
   lazy-loaded so they cost nothing until the section is near. Seasonal: remove the markers' content
   (and the nav and footer links) after the season. */
const HOME_START = '<!-- december:home (written by tools/build_december.mjs) -->';
const HOME_END = '<!-- /december:home -->';
const homeFile = path.join(root, 'dist/index.html');
const homeBlock = `${HOME_START}
    <section class="home-dec" id="december" aria-labelledby="home-dec-heading">
      <style>
        .home-dec { position: relative; height: clamp(560px, 82vh, 760px); overflow: hidden; overflow: clip; isolation: isolate; background: #efe2c4; color: var(--ink); }
        .home-dec-bg, .home-dec-bg img { position: absolute; inset: 0; width: 100%; height: 100%; }
        .home-dec-bg img { object-fit: cover; object-position: 50% 40%; }
        .home-dec-sun { position: absolute; z-index: 1; left: 50%; top: 2%; width: min(34vw, 46vh); height: auto; transform: translateX(-50%); }
        .home-dec-copy { position: absolute; z-index: 3; left: 50%; top: 12%; width: min(60vw, 820px); transform: translateX(-50%); text-align: center; }
        .home-dec h2 { margin: 0; font-size: clamp(3rem, 7.4vw, 7.6rem); font-weight: 900; letter-spacing: -.075em; line-height: .82; }
        .home-dec h2 em { display: block; margin-top: .16em; font-family: Georgia, 'Times New Roman', serif; font-size: .34em; font-weight: 400; font-style: italic; letter-spacing: -.02em; color: #7d1a10; text-shadow: 0 0 10px rgba(255,248,225,.9); }
        .home-dec-note { display: inline-block; max-width: 34ch; margin: 18px 0 0; padding: 14px 18px 16px; background: #fbf4e2; box-shadow: 0 18px 30px -18px rgba(0,0,0,.5); transform: rotate(-1.2deg); font-family: Georgia, 'Times New Roman', serif; font-size: clamp(.98rem, 1.3vw, 1.12rem); line-height: 1.4; }
        .home-dec-cta { display: inline-block; margin-top: 12px; border-radius: 99px; padding: 12px 20px; background: var(--ink); color: var(--yellow); font-family: Arial, Helvetica, sans-serif; font-size: .68rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
        .home-dec-cta:hover { background: var(--red); color: var(--paper); }
        .home-dec-fig { position: absolute; z-index: 2; bottom: -1%; height: 46%; width: auto; filter: drop-shadow(0 12px 14px rgba(40,20,0,.28)); }
        .home-dec-fig.f1 { left: 2%; } .home-dec-fig.f2 { left: 14%; height: 42%; } .home-dec-fig.f3 { right: 3%; }
        @media (max-width: 760px) {
          .home-dec { height: 720px; }
          .home-dec-sun { top: 18%; width: 66vw; }
          .home-dec-copy { top: 26%; width: 92vw; }
          .home-dec h2 { font-size: 17vw; }
          .home-dec-fig { height: 28%; } .home-dec-fig.f1 { left: -3%; } .home-dec-fig.f2 { left: 24%; height: 27%; } .home-dec-fig.f3 { right: 0; }
        }
      </style>
      <picture class="home-dec-bg" aria-hidden="true">
        <source media="(max-width: 760px)" srcset="${BASE}img/hero-cloth-tall.webp" width="820" height="1451">
        <img src="${BASE}img/hero-cloth-wide.webp" alt="" width="1800" height="1018" loading="lazy" decoding="async">
      </picture>
      <img class="home-dec-sun" src="${BASE}img/hero-sun.webp" alt="" width="890" height="900" loading="lazy" decoding="async">
      <img class="home-dec-fig f1" src="${BASE}img/fig-kente.webp" alt="" width="459" height="700" loading="lazy" decoding="async">
      <img class="home-dec-fig f2" src="${BASE}img/fig-drummer.webp" alt="" width="408" height="700" loading="lazy" decoding="async">
      <img class="home-dec-fig f3" src="${BASE}img/fig-dancer.webp" alt="" width="449" height="700" loading="lazy" decoding="async">
      <div class="home-dec-copy">
        <h2 id="home-dec-heading">December <em>in Ghana</em></h2>
        <p class="home-dec-note">${events.length} concerts, carnivals, festivals and markets across Ghana, 1 December to ${esc(endLabel)}: dates, places and what to expect. Save the ones you like and send your plan to friends.</p><br>
        <a class="home-dec-cta" href="${BASE}">See what’s on →</a>
      </div>
    </section>
    ${HOME_END}`;
const homeHtml = (() => {
  const current = fs.readFileSync(homeFile, 'utf8');
  const a = current.indexOf(HOME_START), b = current.indexOf(HOME_END);
  if (a < 0 || b < a) throw new Error('dist/index.html has no december:home markers');
  return current.slice(0, a) + homeBlock + current.slice(b + HOME_END.length);
})();

/* ---------- Write (or check) ---------- */
let stale = 0;
for (const [out, content] of [[file, html], [homeFile, homeHtml]]) {
  const current = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
  if (current === content) continue;
  if (checkOnly) { stale++; console.error(`Stale: ${path.relative(root, out)}`); continue; }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content);
}
if (checkOnly && stale) process.exit(1);
console.log(`${checkOnly ? 'Checked' : 'Wrote'} the December ${year} page (${events.length} events) and the home page section.`);
