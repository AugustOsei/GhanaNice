/* Writes the festivals list page and one page per festival, from tools/festivals/<slug>.json.

   Each JSON file is one festival or cultural event: its card on the list page, and (when it has
   "sections") its own page built from tools/festival-template.html. The list page comes from
   tools/festivals-template.html. Everything a reader or a search engine needs is in the HTML; the
   only script on the list page works out the "Coming up" dates from today's date.

   The pages live under BASE. PROTOTYPE adds noindex (for a trial copy elsewhere); tools/build_regions.mjs
   puts the live pages in the sitemap and tools/smoke.mjs runs this with --check.

   Re-run after editing the data or a template:  node tools/build_festivals.mjs  (--check reports stale pages) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.ghananice.com';
const BASE = '/festivals/';
const PROTOTYPE = false;
const out = path.join(root, 'dist', BASE);
const checkOnly = process.argv.includes('--check');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const KIND = { trad: ['Traditional festival', 'k-trad'], event: ['Cultural event', 'k-event'] };

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = (html) => String(html ?? '').replace(/<[^>]+>/g, '').replace(/\[\[[\d,\s]+\]\]/g, '');
const regionSlug = (r) => r.toLowerCase().replace(/ /g, '-');
const pageUrl = (f) => `${SITE}${BASE}${f.slug}/`;
/* [[1,3]] in the copy becomes linked source numbers. */
const cite = (html) => String(html ?? '').replace(/\[\[([\d,\s]+)\]\]/g, (_, n) => n.split(',').map((x) => `<sup><a href="#s${x.trim()}">${x.trim()}</a></sup>`).join(''));
const longDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };

const festivals = fs.readdirSync(path.join(root, 'tools/festivals')).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(root, 'tools/festivals', f), 'utf8')))
  .sort((a, b) => (a.month ?? 99) - (b.month ?? 99) || (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
const hasPage = (f) => Array.isArray(f.sections) && f.sections.length > 0;

/* The site footer, taken from the plain-page template so it stays in step with the rest of the site. */
const pageTemplate = fs.readFileSync(path.join(root, 'tools/page-template.html'), 'utf8');
const footer = pageTemplate.slice(pageTemplate.indexOf('  <footer class="site-footer">'), pageTemplate.indexOf('</footer>') + 9);

/* Cut-outs: small flat drawings with a white cut edge (the #cut filter in the template). */
const CUTOUTS = {
  bowl: '<path d="M36 112 Q100 196 164 112Z" fill="#c8913a"/><path d="M50 112 C56 66 144 66 150 112Z" fill="#f2dc8f"/><path d="M44 138 Q100 150 156 138" stroke="#9a6a24" stroke-width="4" fill="none"/><ellipse cx="100" cy="112" rx="64" ry="9" fill="none" stroke="#9a6a24" stroke-width="3"/>',
  drum: '<path d="M64 62 L136 62 L124 186 L76 186Z" fill="#9c5a2c"/><path d="M66 82 L134 82 L133 92 L67 92Z M72 150 L128 150 L127 160 L73 160Z" fill="#df4a32"/><ellipse cx="100" cy="62" rx="36" ry="10" fill="#efe2c4"/><path d="M70 94 L82 148 L94 94 L106 148 L118 94 L130 148" fill="none" stroke="#3b2414" stroke-width="3"/><path d="M164 14 L116 60 M36 14 L84 60" stroke="#6b4423" stroke-width="7" stroke-linecap="round"/>',
  umbrella: '<path d="M100 43 L100 194" stroke="#5a3a1e" stroke-width="6" stroke-linecap="round"/><path d="M38 104 Q100 16 164 104Z" fill="#df4a32"/><path d="M38 104 q7 13 14 0 q7 13 14 0 q7 13 14 0 q7 13 14 0 q7 13 14 0 q7 13 14 0 q7 13 14 0 q7 13 14 0 q7 13 14 0Z" fill="#f5c842"/><path d="M58 80 Q100 40 144 80" stroke="#f5c842" stroke-width="6" fill="none"/><circle cx="100" cy="36" r="8" fill="#f5c842"/>',
  cocoa: '<path d="M108 38 C128 16 164 14 184 24 C164 42 132 48 108 38Z" fill="#5c8a3a"/><path d="M100 36 C142 46 152 122 104 178 C56 122 62 46 100 36Z" fill="#e09a2c"/><path d="M100 40 C80 80 82 140 104 176 M100 40 C120 80 122 140 104 176" fill="none" stroke="#b46a14" stroke-width="3"/>',
  torch: '<path d="M94 192 L101 112 L115 112 L107 192Z" fill="#8a5a33"/><path d="M108 114 C76 94 92 62 102 38 C107 60 118 56 117 32 C138 60 140 98 108 114Z" fill="#f08a24"/><path d="M108 106 C95 94 101 78 107 66 C112 80 123 86 108 106Z" fill="#f5c842"/>',
  yam: '<path d="M70 92 C72 70 110 62 146 66 C168 68 172 82 162 92 C148 102 108 104 84 102 C76 101 70 98 70 92Z" fill="#7a4b26"/><path d="M34 128 C34 98 86 86 138 90 C170 92 182 110 168 126 C150 142 80 146 50 142 C40 140 34 134 34 128Z" fill="#8f5a2e"/><ellipse cx="40" cy="128" rx="8" ry="15" fill="#f3ead2"/><path d="M150 70 C160 50 176 44 188 50 C178 58 168 66 150 70Z" fill="#5c8a3a"/>',
};
const cutout = (name) => CUTOUTS[name] ? `        <div class="cutout" aria-hidden="true"><svg viewBox="0 0 200 200"><g filter="url(#cut)">${CUTOUTS[name]}</g></svg></div>` : '';

function photoFigure(f, p, { lazy = true } = {}) {
  const licence = p.license === 'public domain' ? 'public domain' : esc(p.license);
  return `<figure class="print"><span class="tape" aria-hidden="true"></span><img src="img/${esc(p.file)}" alt="${esc(p.alt)}" width="${p.w}" height="${p.h}"${lazy ? ' loading="lazy"' : ''} decoding="async"><figcaption><span>${esc(p.caption)}</span><small>${esc(p.author)} · <a href="${esc(p.source)}" target="_blank" rel="noopener">${licence}</a></small></figcaption></figure>`;
}

function heroHtml(f) {
  const month = f.recurring ? 'Every six weeks' : MONTHS[f.month];
  const paper = `        <div class="paper">
          <p class="crumbs"><a href="${BASE}">Festivals</a> · ${esc(month)}${f.region ? ` · <a href="/regions/${regionSlug(f.region)}/">${esc(f.region)}</a>` : ''}</p>
          <h1>${esc(f.name)}</h1>
          <p class="subtitle">${esc(f.subtitle)}</p>
          <p class="answer">${f.answer}</p>
${f.sticky ? `          <p class="sticky"><b>${esc(f.sticky.title)}</b><span>${esc(f.sticky.text)}</span></p>\n` : ''}        </div>`;
  const photo = f.hero ? `        ${photoFigure(f, f.hero, { lazy: false })}` : '';
  return `    <header class="fhero">
      <div class="hero-grid${f.hero ? '' : ' no-photo'}">
${paper}
${photo}
      </div>
    </header>`;
}

function factsHtml(f) {
  const facts = [...(f.facts || [])];
  if (f.region) facts.push(['Region', `<a href="/regions/${regionSlug(f.region)}/">${esc(f.region)}</a>`]);
  return `    <div class="facts">
      <dl>
${facts.map(([k, v]) => `        <div><dt>${esc(k)}</dt><dd>${k === 'Region' ? v : esc(v)}</dd></div>`).join('\n')}
      </dl>
    </div>`;
}

function sectionHtml(s) {
  let body = '';
  if (s.days) body = `<ol class="days">\n${s.days.map((d) => `            <li><b>${esc(d.label)}</b><div><h3>${esc(d.title)}</h3><p>${cite(d.html)}</p></div></li>`).join('\n')}\n          </ol>`;
  else if (s.tips) body = `<ul class="tips">\n${s.tips.map((t) => `            <li>${cite(t)}</li>`).join('\n')}\n          </ul>`;
  else body = cite(s.html);
  return `        <section id="${esc(s.id)}" aria-labelledby="h-${esc(s.id)}">
          <h2 id="h-${esc(s.id)}">${esc(s.title)}</h2>
          ${body}
        </section>`;
}

function articleHtml(f) {
  const faq = f.faq?.length ? `        <section class="faq" id="faq" aria-labelledby="h-faq">
          <h2 id="h-faq">Questions people ask</h2>
${f.faq.map((q) => `          <h3>${esc(q.q)}</h3>\n          <p>${esc(q.a)}</p>`).join('\n')}
        </section>` : '';
  const sources = `        <section class="sources" id="sources" aria-labelledby="h-sources">
          <h2 id="h-sources">Sources</h2>
          <ol>
${(f.sources || []).map((s, i) => `            <li id="s${i + 1}">${s.cite}, <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.site)}</a>${s.date ? `, ${esc(s.date)}` : ''}.</li>`).join('\n')}
          </ol>
          <p class="updated">Last checked ${longDate(f.checked)}. Spotted something wrong or know this year’s dates? <a href="/contact/">Tell us</a>.</p>
        </section>`;
  return [...f.sections.map(sectionHtml), faq, sources].filter(Boolean).join('\n\n');
}

function asideHtml(f) {
  const photos = (f.photos || []).map((p) => `        ${photoFigure(f, p)}`);
  if (f.cutout) photos.splice(Math.min(2, photos.length), 0, cutout(f.cutout));
  if (!photos.length) return '';
  return `      <aside class="aside" aria-label="Photos">\n${photos.join('\n')}\n      </aside>`;
}

function moreHtml(f) {
  const others = festivals.filter((o) => o !== f && !o.recurring && (o.month === f.month || (f.recurring && false))).slice(0, 4);
  const pick = others.length ? others : festivals.filter((o) => o !== f && hasPage(o)).slice(0, 4);
  const title = others.length ? `Also in ${MONTHS[f.month]}` : 'More festivals';
  const link = (o) => hasPage(o) ? `${BASE}${o.slug}/` : `${BASE}#f-${o.slug}`;
  return `    <section class="more" aria-labelledby="h-more">
      <div class="more-in">
        <h2 id="h-more">${title}</h2>
        <ul>
${pick.map((o) => `          <li><a href="${link(o)}"${o.kind === 'event' ? ' style="--kc:var(--lilac)"' : ''}><span>${KIND[o.kind][0]}${o.region ? ' · ' + esc(o.region) : ''}</span><b>${esc(o.name)}</b><i>${esc(o.card.sum)}</i></a></li>`).join('\n')}
        </ul>
        <a class="back" href="${BASE}">← All festivals and cultural events</a>
      </div>
    </section>`;
}

function jsonld(f) {
  const url = pageUrl(f);
  const graph = [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'GhanaNice', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Festivals', item: `${SITE}${BASE}` },
      { '@type': 'ListItem', position: 3, name: f.name, item: url },
    ] },
    { '@type': 'Article', headline: f.ogTitle || f.name, description: strip(f.answer).slice(0, 300), ...(f.hero ? { image: `${url}img/${f.hero.file}` } : {}),
      dateModified: f.checked, author: { '@type': 'Organization', name: 'GhanaNice', url: `${SITE}/` }, publisher: { '@type': 'Organization', name: 'GhanaNice', url: `${SITE}/` },
      about: { '@type': f.kind === 'event' ? 'Event' : 'Festival', name: f.name, description: f.schema?.description || strip(f.answer),
        location: { '@type': 'Place', name: f.schema?.location || f.card.place, address: { '@type': 'PostalAddress', ...(f.schema?.locality ? { addressLocality: f.schema.locality } : {}), ...(f.region ? { addressRegion: f.region } : {}), addressCountry: 'GH' } },
        ...(f.schema?.organizer ? { organizer: { '@type': 'Organization', name: f.schema.organizer } } : {}) } },
  ];
  if (f.faq?.length) graph.push({ '@type': 'FAQPage', mainEntity: f.faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })) });
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/^/gm, '  ').replace(/<\//g, '<\\/');
}

const fill = (tpl, values) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => { if (!(k in values)) throw new Error(`Template token {{${k}}} has no value`); return values[k]; });

function festivalPage(f) {
  const template = fs.readFileSync(path.join(root, 'tools/festival-template.html'), 'utf8');
  const aside = asideHtml(f);
  return fill(template, {
    metaTitle: esc(`${f.metaTitle} · GhanaNice`), metaDescription: esc(f.metaDescription), ogTitle: esc(f.ogTitle || f.name), url: pageUrl(f), base: BASE,
    robots: PROTOTYPE ? '  <meta name="robots" content="noindex">\n' : '',
    ogImage: f.hero ? `  <meta property="og:image" content="${pageUrl(f)}img/${esc(f.hero.file)}">\n` : '',
    jsonld: jsonld(f), hero: heroHtml(f), facts: factsHtml(f), sections: articleHtml(f), aside, articleClass: aside ? '' : ' no-aside', more: moreHtml(f), footer,
  });
}

/* ---------- The list page ---------- */
const PAPERS = ['#f3e9cf', '#e8e0f6', '#f6dcc9', '#e3eed2', '#f4e3a8'];
function cardImage(f) {
  if (hasPage(f) && f.hero) return `${f.slug}/img/${f.hero.file}`;
  return f.card.thumb ? f.card.thumb.file : '';
}
function card(f) {
  const k = KIND[f.kind], img = cardImage(f);
  const facts = [['When', f.card.when], ['Where', f.card.place], f.card.keeper ? ['Kept by', f.card.keeper] : null].filter(Boolean);
  return `<li><article class="card ${k[1]}" id="f-${f.slug}">${img ? `<div class="card-img"><img src="${esc(img)}" alt="${esc(f.name)}, ${esc(f.card.place)}" loading="lazy" decoding="async"></div>` : ''}<div class="card-body">
          <p class="eyebrow"><b>${k[0]}</b>${f.region ? ` · <a href="/regions/${regionSlug(f.region)}/">${esc(f.region)}</a>` : ''}</p>
          <h3>${esc(f.name)}</h3><p class="card-sum">${esc(f.card.sum)}</p>${!img && f.card.more ? `<p class="card-sum">${esc(f.card.more)}</p>` : ''}
          <ul class="facts">${facts.map(([a, b]) => `<li><b>${a}</b><span>${esc(b)}</span></li>`).join('')}</ul>
          ${hasPage(f) ? `<a class="more" href="${f.slug}/" aria-label="Read more about ${esc(f.name)}">Read more →</a>` : ''}
        </div></article></li>`;
}
function listPage() {
  const template = fs.readFileSync(path.join(root, 'tools/festivals-template.html'), 'utf8');
  let list = '';
  MONTHS.forEach((name, m) => {
    const inMonth = festivals.filter((f) => f.month === m);
    if (inMonth.length) list += `        <h2 class="month-h" id="m-${m}">${name} <span>${inMonth.length} listed</span></h2><ul class="cards">\n        ${inMonth.map(card).join('\n        ')}\n        </ul>\n`;
  });
  const recurring = festivals.filter((f) => f.recurring);
  if (recurring.length) list += `        <h2 class="month-h">Through the year <span>every six weeks</span></h2><ul class="cards">\n        ${recurring.map(card).join('\n        ')}\n        </ul>\n`;
  const photos = festivals.map((f) => {
    const p = hasPage(f) && f.hero ? f.hero : f.card.thumb;
    return p ? `${esc(f.name)} by <a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.author)}</a> (${esc(p.license)})` : null;
  }).filter(Boolean);
  const upcoming = festivals.filter((f) => !f.recurring).map((f) => ({ name: f.name, place: f.card.place, short: f.card.short, m: f.month }));
  const ak = festivals.find((f) => f.recurring);
  const description = `${festivals.length} traditional festivals and cultural events across Ghana, January to December: where each happens, when it usually falls and who keeps it.`;
  const listUrl = `${SITE}${BASE}`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'GhanaNice', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Festivals', item: listUrl },
    ] },
    { '@type': 'CollectionPage', name: 'Festivals and cultural events in Ghana', description, url: listUrl,
      mainEntity: { '@type': 'ItemList', itemListElement: festivals.map((f, i) => ({ '@type': 'ListItem', position: i + 1, name: f.name, url: hasPage(f) ? `${listUrl}${f.slug}/` : `${listUrl}#f-${f.slug}` })) } },
  ] };
  return fill(template, {
    url: listUrl, description: esc(description), ogImage: `${listUrl}img/fetu.webp`,
    jsonld: JSON.stringify(ld, null, 2).replace(/^/gm, '  ').replace(/<\//g, '<\\/'),
    count: festivals.length,
    flaps: String(festivals.length).split('').map((d) => `<span class="flap" data-digit="${d}"><b class="t">${d}</b><b class="b">${d}</b><b class="ft">${d}</b><b class="fb">${d}</b><i></i><i></i></span>`).join(''),
    regionCount: new Set(festivals.map((f) => f.region).filter(Boolean)).size,
    base: BASE, robots: PROTOTYPE ? '  <meta name="robots" content="noindex">\n' : '', footer, list: list.trimEnd(),
    credits: `Photos from Wikimedia Commons: ${photos.join(', ')}. Full credits on the <a href="/credits.html">photo credits</a> page.`,
    data: JSON.stringify({ upcoming, akwasidae: ak ? { anchor: ak.recurring.anchor, every: ak.recurring.days, slug: ak.slug } : null }).replace(/<\//g, '<\\/'),
  });
}

/* ---------- Write (or check) ---------- */
const pages = [[path.join(out, 'index.html'), listPage()], ...festivals.filter(hasPage).map((f) => [path.join(out, f.slug, 'index.html'), festivalPage(f)])];
let stale = 0;
for (const [file, html] of pages) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (current === html) continue;
  if (checkOnly) { stale++; console.error(`Stale: ${path.relative(root, file)}`); continue; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
if (checkOnly && stale) process.exit(1);
console.log(`${checkOnly ? 'Checked' : 'Wrote'} the festivals list and ${pages.length - 1} festival pages (${festivals.length} festivals in all).`);
